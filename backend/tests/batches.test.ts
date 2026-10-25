import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { api, createPoint, createUser, patch, placeOrder, resetDatabase, scenario } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

type S = Awaited<ReturnType<typeof scenario>>;

// Cria e aceita um pedido do produtor A para o consumidor i.
async function acceptedOrder(s: S, i: number, pointId = s.point.id) {
  const order = await placeOrder(s.consumers[i], pointId, [{ produtoId: s.productA.id, quantidade: 1 }]);
  const res = await patch(`/orders/${order.id}/accept`, s.producerA);
  expect(res.status).toBe(200);
  return res.body;
}

const getOrder = async (s: S, id: number, who = s.admin) => (await api().get(`/api/orders/${id}`).set(who.auth)).body;
const getBatch = async (s: S, id: number) => (await api().get(`/api/batches/${id}`).set(s.admin.auth)).body;

describe('formação do lote (RN12, RN13)', () => {
  it('o aceite abre um lote de 7 dias com o custo do ponto', async () => {
    const s = await scenario();
    const order = await acceptedOrder(s, 0);

    expect(order).toMatchObject({ status: 'ACEITO', lote: 'LOTE-001', loteStatus: 'EM_FORMACAO', taxaEntrega: null, taxaEstimada: 18 });

    const batch = await getBatch(s, order.loteId);
    expect(batch).toMatchObject({ codigo: 'LOTE-001', quantidadePedidos: 1, custoEntrega: 18, status: 'EM_FORMACAO', taxaDefinitiva: false });
    const days = (new Date(batch.dataLimite).getTime() - new Date(batch.dataAbertura).getTime()) / 86_400_000;
    expect(days).toBeCloseTo(7, 5);
  });

  it('pedido pendente não entra no lote', async () => {
    const s = await scenario();
    const pending = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    expect(pending.lote).toBeNull();
    expect(await prisma.batch.count()).toBe(0);
  });

  it('pedidos de produtores diferentes para o mesmo ponto ficam no mesmo lote', async () => {
    const s = await scenario();
    const a = await acceptedOrder(s, 0);
    const orderB = await placeOrder(s.consumers[1], s.point.id, [{ produtoId: s.productB.id, quantidade: 1 }]);
    const b = (await patch(`/orders/${orderB.id}/accept`, s.producerB)).body;

    expect(b.loteId).toBe(a.loteId);
    expect(b.taxaEstimada).toBe(9);
    // A estimativa do primeiro pedido também caiu.
    expect((await getOrder(s, a.id)).taxaEstimada).toBe(9);
  });

  it('cada ponto tem o seu lote', async () => {
    const s = await scenario();
    const other = await createPoint(null, 2400, 'Ponto Bairro');
    const a = await acceptedOrder(s, 0);
    const b = await acceptedOrder(s, 1, other.id);

    expect(b.loteId).not.toBe(a.loteId);
    expect(b.taxaEstimada).toBe(24);
  });
});

describe('fechamento com 3 pedidos (RN06, RN15, RN16)', () => {
  it('o 3º aceite fecha o lote e grava R$ 6,00 para cada', async () => {
    const s = await scenario();
    const orders = [await acceptedOrder(s, 0), await acceptedOrder(s, 1), await acceptedOrder(s, 2)];

    const batch = await getBatch(s, orders[0].loteId);
    expect(batch).toMatchObject({ quantidadePedidos: 3, status: 'FECHADO', taxaDefinitiva: true, taxaPorPedido: 6 });
    expect(batch.dataFechamento).not.toBeNull();

    for (const o of orders) {
      expect(await getOrder(s, o.id)).toMatchObject({ taxaEntrega: 6, taxaEstimada: 6, taxaDefinitiva: true, total: 41, loteStatus: 'FECHADO' });
    }
    expect(await prisma.auditLog.count({ where: { action: 'LOTE_FECHADO' } })).toBe(1);
  });

  it('a sobra de centavos vai para os primeiros e a soma bate com o custo', async () => {
    const s = await scenario(2000);
    const orders = [await acceptedOrder(s, 0), await acceptedOrder(s, 1), await acceptedOrder(s, 2)];
    const fees = await Promise.all(orders.map(async o => (await getOrder(s, o.id)).taxaEntrega));

    expect(fees).toEqual([6.67, 6.67, 6.66]);
  });

  it('lote fechado não recebe mais pedidos: o 4º abre um lote novo (RN14)', async () => {
    const s = await scenario();
    for (const i of [0, 1, 2]) await acceptedOrder(s, i);
    const fourth = await acceptedOrder(s, 3);

    expect(fourth.lote).toBe('LOTE-002');
    expect(fourth.loteStatus).toBe('EM_FORMACAO');
    expect(fourth.taxaEstimada).toBe(18);
  });

  it('4 aceites simultâneos: um lote fecha com 3 e o outro fica com 1', async () => {
    const s = await scenario();
    const orders = [];
    for (const i of [0, 1, 2, 3]) orders.push(await placeOrder(s.consumers[i], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]));

    const results = await Promise.all(orders.map(o => patch(`/orders/${o.id}/accept`, s.producerA)));
    expect(results.every(r => r.status === 200)).toBe(true);

    const batches = await prisma.batch.findMany({ include: { orders: true }, orderBy: { id: 'asc' } });
    expect(batches.map(b => [b.status, b.orders.length])).toEqual([
      ['FECHADO', 3],
      ['EM_FORMACAO', 1],
    ]);
    const fees = batches[0].orders.map(o => o.deliveryShareCents);
    expect(fees.reduce((a, b) => a! + b!, 0)).toBe(1800);
  });

  it('mudar o custo do ponto não altera o lote já aberto', async () => {
    const s = await scenario();
    const first = await acceptedOrder(s, 0);
    await patch(`/pickup-points/${s.point.id}`, s.admin, { custoEntrega: 30 }).expect(200);
    await acceptedOrder(s, 1);
    await acceptedOrder(s, 2);

    expect((await getOrder(s, first.id)).taxaEntrega).toBe(6);
    expect((await acceptedOrder(s, 3)).taxaEstimada).toBe(30);
  });
});

describe('fechamento por prazo de 7 dias (RN06)', () => {
  it('fecha com 1 pedido e cobra o custo inteiro', async () => {
    const s = await scenario();
    const order = await acceptedOrder(s, 0);
    await prisma.batch.update({ where: { id: order.loteId }, data: { deadline: new Date(Date.now() - 1000) } });

    const batch = await getBatch(s, order.loteId);
    expect(batch).toMatchObject({ status: 'FECHADO', quantidadePedidos: 1, taxaDefinitiva: true });
    expect(await getOrder(s, order.id)).toMatchObject({ taxaEntrega: 18, taxaDefinitiva: true });
  });

  it('fecha com 2 pedidos e divide em R$ 9,00', async () => {
    const s = await scenario();
    const a = await acceptedOrder(s, 0);
    const b = await acceptedOrder(s, 1);
    await prisma.batch.update({ where: { id: a.loteId }, data: { deadline: new Date(Date.now() - 1000) } });

    expect((await getOrder(s, a.id)).taxaEntrega).toBe(9);
    expect((await getOrder(s, b.id)).taxaEntrega).toBe(9);
  });

  it('aceite depois do prazo fecha o lote vencido e abre outro', async () => {
    const s = await scenario();
    const a = await acceptedOrder(s, 0);
    const pending = await placeOrder(s.consumers[1], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    await prisma.batch.update({ where: { id: a.loteId }, data: { deadline: new Date(Date.now() - 1000) } });

    const b = (await patch(`/orders/${pending.id}/accept`, s.producerA)).body;
    expect(b.loteId).not.toBe(a.loteId);
    expect((await getBatch(s, a.loteId)).status).toBe('FECHADO');
  });

  it('lote vencido sem nenhum pedido ativo é concluído', async () => {
    const s = await scenario();
    const a = await acceptedOrder(s, 0);
    await patch(`/orders/${a.id}/cancel`, s.consumers[0]).expect(200);
    await prisma.batch.update({ where: { id: a.loteId }, data: { deadline: new Date(Date.now() - 1000) } });

    expect(await getBatch(s, a.loteId)).toMatchObject({ status: 'CONCLUIDO', quantidadePedidos: 0, taxaPorPedido: null });
  });
});

describe('status do lote acompanha os pedidos', () => {
  it('FECHADO → AGUARDANDO_PRODUCAO → PRONTO_PARA_ENTREGA → CONCLUIDO', async () => {
    const s = await scenario();
    const orders = [await acceptedOrder(s, 0), await acceptedOrder(s, 1), await acceptedOrder(s, 2)];
    const batchId = orders[0].loteId;
    const status = async () => (await getBatch(s, batchId)).status;

    expect(await status()).toBe('FECHADO');
    await patch(`/orders/${orders[0].id}/status`, s.producerA, { status: 'EM_PRODUCAO' }).expect(200);
    expect(await status()).toBe('AGUARDANDO_PRODUCAO');

    for (const o of orders) {
      if (o.id !== orders[0].id) await patch(`/orders/${o.id}/status`, s.producerA, { status: 'EM_PRODUCAO' }).expect(200);
      await patch(`/orders/${o.id}/status`, s.producerA, { status: 'PRONTO_PARA_ENTREGA' }).expect(200);
    }
    expect(await status()).toBe('PRONTO_PARA_ENTREGA');

    for (const o of orders) {
      await patch(`/orders/${o.id}/received`, s.attendant).expect(200);
      await patch(`/orders/${o.id}/picked-up`, s.attendant).expect(200);
    }
    expect(await status()).toBe('CONCLUIDO');
  });
});

describe('consulta de lotes', () => {
  it('filtra por ponto e status; pedidos do lote só para admin e atendente do ponto', async () => {
    const s = await scenario();
    const otherAttendant = await createUser('ATENDENTE');
    const order = await acceptedOrder(s, 0);

    expect((await api().get(`/api/batches?status=EM_FORMACAO&pontoRetiradaId=${s.point.id}`).set(s.consumers[0].auth)).body.meta.total).toBe(1);
    expect((await api().get('/api/batches?status=FECHADO').set(s.consumers[0].auth)).body.meta.total).toBe(0);
    expect((await api().get('/api/batches')).status).toBe(401);
    expect((await api().get('/api/batches/999').set(s.admin.auth)).status).toBe(404);

    const ordersOf = (who: { auth: Record<string, string> }) => api().get(`/api/batches/${order.loteId}/orders`).set(who.auth);
    expect((await ordersOf(s.admin)).body).toHaveLength(1);
    expect((await ordersOf(s.attendant)).status).toBe(200);
    expect((await ordersOf(otherAttendant)).status).toBe(403);
    expect((await ordersOf(s.consumers[0])).status).toBe(403);
  });
});
