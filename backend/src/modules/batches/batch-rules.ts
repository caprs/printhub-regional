// Regras dos lotes coletivos (RN06, RN12–RN17, RN19).
// Todas as funções recebem a transação: quem chama garante o bloqueio do ponto.
import type { Tx } from '../../lib/prisma.js';
import { audit } from '../../lib/audit.js';
import { splitCents } from '../../lib/money.js';
import type { BatchStatus, OrderStatus } from '../../generated/prisma/client.js';

export const BATCH_SIZE = 3;
export const BATCH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Pedido cancelado continua ligado ao lote (histórico), mas não conta.
export const activeOrders = { where: { status: { not: 'CANCELADO' as const } } };

export const batchCode = (id: number) => `LOTE-${String(id).padStart(3, '0')}`;

// Serializa tudo o que mexe nos lotes de um ponto: aceite, fechamento, cancelamento.
// Sem isso, dois aceites simultâneos poderiam colocar 4 pedidos num lote de 3.
export async function lockPickupPoint(tx: Tx, pickupPointId: number) {
  await tx.$queryRaw`SELECT id FROM pickup_points WHERE id = ${pickupPointId} FOR UPDATE`;
}

// Lote em formação do ponto. Fecha o vencido e abre um novo se precisar.
export async function openBatchFor(tx: Tx, pickupPointId: number, now: Date) {
  const current = await tx.batch.findFirst({ where: { pickupPointId, status: 'EM_FORMACAO' } });

  if (current && current.deadline > now) return current;
  if (current) await closeBatch(tx, current.id, null, 'PRAZO');

  const point = await tx.pickupPoint.findUniqueOrThrow({ where: { id: pickupPointId } });
  return tx.batch.create({
    data: {
      pickupPointId,
      deliveryCostCents: point.deliveryCostCents,
      startDate: now,
      deadline: new Date(now.getTime() + BATCH_WINDOW_MS),
    },
  });
}

// Fecha o lote e grava a taxa definitiva de cada pedido.
export async function closeBatch(tx: Tx, batchId: number, userId: number | null, reason: 'TRES_PEDIDOS' | 'PRAZO') {
  const now = new Date();
  // Só o primeiro a chegar fecha; chamadas repetidas não fazem nada.
  const { count } = await tx.batch.updateMany({
    where: { id: batchId, status: 'EM_FORMACAO' },
    data: { status: 'FECHADO', closedAt: now },
  });
  if (!count) return;

  const batch = await tx.batch.findUniqueOrThrow({ where: { id: batchId } });
  const orders = await tx.order.findMany({
    where: { batchId, ...activeOrders.where },
    orderBy: { batchPosition: 'asc' },
    select: { id: true },
  });

  const shares = orders.length ? splitCents(batch.deliveryCostCents, orders.length) : [];
  for (const [i, order] of orders.entries()) {
    await tx.order.update({ where: { id: order.id }, data: { deliveryShareCents: shares[i] } });
  }

  await audit(
    {
      userId,
      action: 'LOTE_FECHADO',
      entity: 'lote',
      entityId: batchId,
      data: { motivo: reason, pedidos: orders.length, taxas: shares },
    },
    tx,
  );
  await refreshBatchStatus(tx, batchId);
}

const READY: OrderStatus[] = ['PRONTO_PARA_ENTREGA', 'DISPONIVEL_RETIRADA', 'RETIRADO'];

// Depois de fechado, o status do lote acompanha os pedidos.
export async function refreshBatchStatus(tx: Tx, batchId: number) {
  const batch = await tx.batch.findUniqueOrThrow({ where: { id: batchId } });
  if (batch.status === 'EM_FORMACAO') return;

  const statuses = (await tx.order.findMany({ where: { batchId, ...activeOrders.where }, select: { status: true } })).map(
    o => o.status,
  );

  let next: BatchStatus;
  if (statuses.every(s => s === 'RETIRADO')) next = 'CONCLUIDO';
  else if (statuses.every(s => READY.includes(s))) next = 'PRONTO_PARA_ENTREGA';
  else if (statuses.some(s => s !== 'ACEITO')) next = 'AGUARDANDO_PRODUCAO';
  else next = 'FECHADO';

  if (next !== batch.status) await tx.batch.update({ where: { id: batchId }, data: { status: next } });
}
