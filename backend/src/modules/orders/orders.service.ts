import { prisma, type Tx } from '../../lib/prisma.js';
import { AppError, conflict, forbidden, notFound } from '../../lib/errors.js';
import { audit } from '../../lib/audit.js';
import { paginated, skipTake, type Pagination } from '../../lib/pagination.js';
import type { AuthUser } from '../../middlewares/auth.js';
import { BATCH_SIZE, activeOrders, closeBatch, lockPickupPoint, openBatchFor, refreshBatchStatus } from '../batches/batch-rules.js';
import { orderInclude, toPedido } from './order-mapper.js';
import type { Order, OrderStatus, Prisma } from '../../generated/prisma/client.js';

export const ACCEPT_WINDOW_MS = 48 * 60 * 60 * 1000;
export const CANCEL_REASON = { consumer: 'CONSUMIDOR', expired: 'PRAZO_EXPIRADO' } as const;

export type OrderInput = { pontoRetiradaId: number; itens: { produtoId: number; quantidade: number }[] };
export type OrderFilters = Pagination & { status?: OrderStatus };

const invalidTransition = () =>
  conflict('TRANSICAO_INVALIDA', 'Esta ação não é permitida na situação atual do pedido.');

// Muda o status só se ninguém mudou antes (proteção contra cliques duplos e corridas).
async function transition(
  tx: Tx,
  order: Order,
  to: OrderStatus,
  userId: number | null,
  action: string,
  data: Prisma.OrderUncheckedUpdateManyInput = {},
) {
  const { count } = await tx.order.updateMany({ where: { id: order.id, status: order.status }, data: { ...data, status: to } });
  if (!count) throw invalidTransition();

  await tx.orderStatusHistory.create({
    data: { orderId: order.id, fromStatus: order.status, toStatus: to, changedById: userId },
  });
  await audit({ userId, action, entity: 'pedido', entityId: order.id, data: { de: order.status, para: to } }, tx);
}

// RN03: devolve ao estoque o que o pedido tinha reservado.
async function restoreStock(tx: Tx, orderId: number) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    await tx.product.update({ where: { id: item.productId }, data: { availableQuantity: { increment: item.quantity } } });
  }
}

async function findOrder(tx: Tx, id: number) {
  const order = await tx.order.findUnique({ where: { id } });
  if (!order) throw notFound('Pedido não encontrado.');
  return order;
}

export async function getById(id: number) {
  return toPedido(await prisma.order.findUniqueOrThrow({ where: { id }, include: orderInclude }));
}

// ---------- Criação ----------

export async function create(user: AuthUser, input: OrderInput) {
  const ids = input.itens.map(i => i.produtoId);
  if (new Set(ids).size !== ids.length) {
    throw new AppError(400, 'VALIDACAO', 'O mesmo produto aparece mais de uma vez.', { itens: 'Produto repetido.' });
  }

  const orderId = await prisma.$transaction(async tx => {
    // RN02
    const point = await tx.pickupPoint.findUnique({ where: { id: input.pontoRetiradaId } });
    if (!point) throw notFound('Ponto de retirada não encontrado.');
    if (!point.active) throw conflict('PONTO_INATIVO', 'Este ponto de retirada não está recebendo pedidos.');

    const products = await tx.product.findMany({
      where: { id: { in: ids } },
      include: { producer: { select: { active: true } } },
    });
    for (const id of ids) {
      const product = products.find(p => p.id === id);
      if (!product?.active || !product.producer.active) {
        throw conflict('PRODUTO_INATIVO', 'Um dos produtos não está mais disponível.', { produtoId: id });
      }
    }

    // RN11
    const producerId = products[0].producerId;
    if (products.some(p => p.producerId !== producerId)) {
      throw conflict('PRODUTORES_DIFERENTES', 'Um pedido só pode ter produtos de um mesmo produtor.');
    }
    // RN09
    if (producerId === user.id) throw conflict('PRODUTO_PROPRIO', 'Você não pode comprar os seus próprios produtos.');

    // RN03: reserva o estoque. A condição no UPDATE impede vender a mesma unidade duas vezes.
    for (const item of input.itens) {
      const { count } = await tx.product.updateMany({
        where: { id: item.produtoId, availableQuantity: { gte: item.quantidade } },
        data: { availableQuantity: { decrement: item.quantidade } },
      });
      if (!count) {
        throw conflict('ESTOQUE_INSUFICIENTE', 'A quantidade solicitada ultrapassa o estoque disponível.', {
          produtoId: item.produtoId,
        });
      }
    }

    const priceOf = (id: number) => products.find(p => p.id === id)!.priceCents;
    const order = await tx.order.create({
      data: {
        consumerId: user.id,
        producerId,
        pickupPointId: point.id,
        productsTotalCents: input.itens.reduce((sum, i) => sum + priceOf(i.produtoId) * i.quantidade, 0),
        acceptDeadline: new Date(Date.now() + ACCEPT_WINDOW_MS),
        items: {
          create: input.itens.map(i => ({ productId: i.produtoId, quantity: i.quantidade, unitPriceCents: priceOf(i.produtoId) })),
        },
        history: { create: { toStatus: 'AGUARDANDO_ACEITACAO', changedById: user.id } },
      },
    });
    await audit({ userId: user.id, action: 'PEDIDO_CRIADO', entity: 'pedido', entityId: order.id }, tx);
    return order.id;
  });

  return getById(orderId);
}

// ---------- Consultas ----------

async function listWhere(where: Prisma.OrderWhereInput, filters: OrderFilters) {
  const fullWhere = { ...where, ...(filters.status && { status: filters.status }) };
  const [rows, total] = await Promise.all([
    prisma.order.findMany({ where: fullWhere, include: orderInclude, orderBy: { createdAt: 'desc' }, ...skipTake(filters) }),
    prisma.order.count({ where: fullWhere }),
  ]);
  return paginated(rows.map(toPedido), total, filters);
}

export const listMine = (user: AuthUser, filters: OrderFilters) => listWhere({ consumerId: user.id }, filters);

export const listForProducer = (user: AuthUser, filters: OrderFilters) => listWhere({ producerId: user.id }, filters);

async function attendantPointId(user: AuthUser) {
  const point = await prisma.pickupPoint.findUnique({ where: { responsibleUserId: user.id } });
  if (!point) throw forbidden('Você não está vinculado a nenhum ponto de retirada.');
  return point.id;
}

// Sem filtro, o atendente vê só o que já chegou ou está a caminho do ponto.
export async function listForAttendant(user: AuthUser, filters: OrderFilters) {
  const pickupPointId = await attendantPointId(user);
  const status = filters.status ? undefined : { in: ['PRONTO_PARA_ENTREGA', 'DISPONIVEL_RETIRADA', 'RETIRADO'] as OrderStatus[] };
  return listWhere({ pickupPointId, ...(status && { status }) }, filters);
}

export async function getForUser(id: number, user: AuthUser) {
  const order = await prisma.order.findUnique({ where: { id }, include: { pickupPoint: true } });
  if (!order) throw notFound('Pedido não encontrado.');

  const allowed =
    user.role === 'ADMINISTRADOR' ||
    order.consumerId === user.id ||
    order.producerId === user.id ||
    order.pickupPoint.responsibleUserId === user.id;
  if (!allowed) throw notFound('Pedido não encontrado.');

  return getById(id);
}

// ---------- Produtor ----------

function assertProducer(order: Order, user: AuthUser) {
  if (order.producerId !== user.id) throw forbidden('Este pedido é de outro produtor.');
}

function assertStillOpen(order: Order) {
  if (order.status === 'CANCELADO' && order.cancelReason === CANCEL_REASON.expired) {
    throw conflict('PRAZO_EXPIRADO', 'O prazo de 48 horas para responder terminou e o pedido foi cancelado.');
  }
  if (order.status !== 'AGUARDANDO_ACEITACAO') throw invalidTransition();
  if (order.acceptDeadline <= new Date()) {
    throw conflict('PRAZO_EXPIRADO', 'O prazo de 48 horas para responder terminou e o pedido foi cancelado.');
  }
}

// RN04, RN12: aceitar coloca o pedido no lote do ponto. O 3º pedido fecha o lote (RN06).
export async function accept(id: number, user: AuthUser) {
  await prisma.$transaction(async tx => {
    const order = await findOrder(tx, id);
    assertProducer(order, user);
    assertStillOpen(order);

    await lockPickupPoint(tx, order.pickupPointId);
    const now = new Date();
    const batch = await openBatchFor(tx, order.pickupPointId, now);
    const position = (await tx.order.count({ where: { batchId: batch.id } })) + 1;

    await transition(tx, order, 'ACEITO', user.id, 'PEDIDO_ACEITO', {
      batchId: batch.id,
      batchPosition: position,
      acceptedAt: now,
    });

    const count = await tx.order.count({ where: { batchId: batch.id, ...activeOrders.where } });
    if (count >= BATCH_SIZE) await closeBatch(tx, batch.id, user.id, 'TRES_PEDIDOS');
  });

  return getById(id);
}

export async function reject(id: number, user: AuthUser, reason?: string) {
  await prisma.$transaction(async tx => {
    const order = await findOrder(tx, id);
    assertProducer(order, user);
    assertStillOpen(order);

    await transition(tx, order, 'REJEITADO', user.id, 'PEDIDO_REJEITADO', { rejectionReason: reason ?? null });
    await restoreStock(tx, id);
  });

  return getById(id);
}

const PRODUCER_STEPS: Partial<Record<OrderStatus, OrderStatus>> = {
  EM_PRODUCAO: 'ACEITO',
  PRONTO_PARA_ENTREGA: 'EM_PRODUCAO',
};

export async function updateStatus(id: number, user: AuthUser, to: 'EM_PRODUCAO' | 'PRONTO_PARA_ENTREGA') {
  await prisma.$transaction(async tx => {
    const order = await findOrder(tx, id);
    assertProducer(order, user);
    if (order.status !== PRODUCER_STEPS[to]) throw invalidTransition();

    await lockPickupPoint(tx, order.pickupPointId);
    await transition(tx, order, to, user.id, 'PEDIDO_STATUS_ALTERADO');
    if (order.batchId) await refreshBatchStatus(tx, order.batchId);
  });

  return getById(id);
}

// ---------- Consumidor ----------

// RN05: cancela antes do aceite ou, depois do aceite, enquanto o lote ainda está em formação.
export async function cancel(id: number, user: AuthUser) {
  await prisma.$transaction(async tx => {
    const order = await findOrder(tx, id);
    if (order.consumerId !== user.id) throw forbidden('Este pedido é de outro cliente.');

    const notAllowed = () =>
      conflict('CANCELAMENTO_NAO_PERMITIDO', 'O pedido só pode ser cancelado antes do início da produção e do fechamento do lote.');

    if (order.status === 'ACEITO') {
      await lockPickupPoint(tx, order.pickupPointId);
      const batch = await tx.batch.findUniqueOrThrow({ where: { id: order.batchId! } });
      if (batch.status !== 'EM_FORMACAO') throw notAllowed();
    } else if (order.status !== 'AGUARDANDO_ACEITACAO') {
      throw notAllowed();
    }

    await transition(tx, order, 'CANCELADO', user.id, 'PEDIDO_CANCELADO', { cancelReason: CANCEL_REASON.consumer });
    await restoreStock(tx, id);
  });

  return getById(id);
}

// ---------- Atendente do ponto ----------

async function assertAttendantOf(tx: Tx, order: Order, user: AuthUser) {
  const point = await tx.pickupPoint.findUniqueOrThrow({ where: { id: order.pickupPointId } });
  // RN07
  if (point.responsibleUserId !== user.id) throw forbidden('Este pedido é de outro ponto de retirada.');
}

// RN19: o ponto só recebe pedidos de lote fechado.
export async function receive(id: number, user: AuthUser) {
  await prisma.$transaction(async tx => {
    const order = await findOrder(tx, id);
    await assertAttendantOf(tx, order, user);
    if (order.status !== 'PRONTO_PARA_ENTREGA') throw invalidTransition();

    await lockPickupPoint(tx, order.pickupPointId);
    const batch = await tx.batch.findUniqueOrThrow({ where: { id: order.batchId! } });
    if (batch.status === 'EM_FORMACAO') {
      throw conflict('LOTE_EM_FORMACAO', 'O lote deste pedido ainda está em formação. Aguarde o fechamento.');
    }

    await transition(tx, order, 'DISPONIVEL_RETIRADA', user.id, 'PEDIDO_RECEBIDO_NO_PONTO');
    await refreshBatchStatus(tx, batch.id);
  });

  return getById(id);
}

// RN10/RN18: o pagamento é presencial; o sistema só registra a retirada.
export async function pickUp(id: number, user: AuthUser) {
  await prisma.$transaction(async tx => {
    const order = await findOrder(tx, id);
    await assertAttendantOf(tx, order, user);
    if (order.status !== 'DISPONIVEL_RETIRADA') throw invalidTransition();

    await lockPickupPoint(tx, order.pickupPointId);
    await transition(tx, order, 'RETIRADO', user.id, 'PEDIDO_RETIRADO');
    await refreshBatchStatus(tx, order.batchId!);
  });

  return getById(id);
}

// ---------- Rotinas automáticas ----------

// RN04: pedido sem resposta em 48 h é cancelado e o estoque volta.
export async function expireOverdueOrders(now = new Date()) {
  const overdue = await prisma.order.findMany({
    where: { status: 'AGUARDANDO_ACEITACAO', acceptDeadline: { lte: now } },
    select: { id: true },
  });

  for (const { id } of overdue) {
    try {
      await prisma.$transaction(async tx => {
        const order = await findOrder(tx, id);
        await transition(tx, order, 'CANCELADO', null, 'PEDIDO_EXPIRADO', { cancelReason: CANCEL_REASON.expired });
        await restoreStock(tx, id);
      });
    } catch (error) {
      // Outro processo respondeu ao pedido no mesmo instante: nada a fazer.
      if (!(error instanceof AppError)) throw error;
    }
  }
  return overdue.length;
}

// RN06: lote que chegou à data-limite fecha com os pedidos que tiver.
export async function closeOverdueBatches(now = new Date()) {
  const overdue = await prisma.batch.findMany({
    where: { status: 'EM_FORMACAO', deadline: { lte: now } },
    select: { id: true, pickupPointId: true },
  });

  for (const batch of overdue) {
    await prisma.$transaction(async tx => {
      await lockPickupPoint(tx, batch.pickupPointId);
      await closeBatch(tx, batch.id, null, 'PRAZO');
    });
  }
  return overdue.length;
}
