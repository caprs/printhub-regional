import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { api, createPoint, patch, placeOrder, resetDatabase, scenario } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const stockOf = async (id: number) => (await prisma.product.findUniqueOrThrow({ where: { id } })).availableQuantity;

describe('POST /api/orders', () => {
  it('cria o pedido com preço do banco e reserva o estoque (RN03)', async () => {
    const s = await scenario();
    const res = await api()
      .post('/api/orders')
      .set(s.consumers[0].auth)
      .send({ pontoRetiradaId: s.point.id, itens: [{ produtoId: s.productA.id, quantidade: 2 }, { produtoId: s.productA2.id, quantidade: 1 }] });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      status: 'AGUARDANDO_ACEITACAO',
      produtorId: s.producerA.user.id,
      produtos: ['Produto A', 'Produto A2'],
      subtotal: 118,
      taxaEntrega: null,
      taxaEstimada: 18,
      total: 136,
      taxaDefinitiva: false,
      lote: null,
    });
    expect(new Date(res.body.prazoAceite).getTime() - Date.now()).toBeGreaterThan(47.9 * 3600_000);
    expect(await stockOf(s.productA.id)).toBe(8);
    expect(await stockOf(s.productA2.id)).toBe(9);
  });

  it('ignora preço enviado pelo cliente', async () => {
    const s = await scenario();
    const order = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1, preco: 0.01 } as never]);
    expect(order.subtotal).toBe(35);
  });

  it('RN02: exige ponto de retirada', async () => {
    const s = await scenario();
    const res = await api().post('/api/orders').set(s.consumers[0].auth).send({ itens: [{ produtoId: s.productA.id, quantidade: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.erro.detalhes).toHaveProperty('pontoRetiradaId');
  });

  it('RN03: recusa quantidade acima do estoque e não reserva nada', async () => {
    const s = await scenario();
    const res = await api()
      .post('/api/orders')
      .set(s.consumers[0].auth)
      .send({ pontoRetiradaId: s.point.id, itens: [{ produtoId: s.productA.id, quantidade: 1 }, { produtoId: s.productA2.id, quantidade: 11 }] });

    expect(res.status).toBe(409);
    expect(res.body.erro).toMatchObject({ codigo: 'ESTOQUE_INSUFICIENTE', detalhes: { produtoId: s.productA2.id } });
    // A transação desfez a reserva do primeiro item.
    expect(await stockOf(s.productA.id)).toBe(10);
  });

  it('RN03: dois pedidos ao mesmo tempo pela última unidade — só um passa', async () => {
    const s = await scenario();
    await prisma.product.update({ where: { id: s.productA.id }, data: { availableQuantity: 1 } });

    const results = await Promise.all(
      s.consumers.map(c =>
        api().post('/api/orders').set(c.auth).send({ pontoRetiradaId: s.point.id, itens: [{ produtoId: s.productA.id, quantidade: 1 }] }),
      ),
    );

    expect(results.filter(r => r.status === 201)).toHaveLength(1);
    expect(results.filter(r => r.status === 409)).toHaveLength(3);
    expect(await stockOf(s.productA.id)).toBe(0);
  });

  it('RN11: recusa produtos de produtores diferentes', async () => {
    const s = await scenario();
    const res = await api()
      .post('/api/orders')
      .set(s.consumers[0].auth)
      .send({ pontoRetiradaId: s.point.id, itens: [{ produtoId: s.productA.id, quantidade: 1 }, { produtoId: s.productB.id, quantidade: 1 }] });

    expect(res.status).toBe(409);
    expect(res.body.erro.codigo).toBe('PRODUTORES_DIFERENTES');
  });

  it('RN09: produtor compra de outro, mas não de si mesmo', async () => {
    const s = await scenario();
    const own = await api().post('/api/orders').set(s.producerA.auth).send({ pontoRetiradaId: s.point.id, itens: [{ produtoId: s.productA.id, quantidade: 1 }] });
    expect(own.status).toBe(409);
    expect(own.body.erro.codigo).toBe('PRODUTO_PROPRIO');

    const other = await api().post('/api/orders').set(s.producerA.auth).send({ pontoRetiradaId: s.point.id, itens: [{ produtoId: s.productB.id, quantidade: 1 }] });
    expect(other.status).toBe(201);
  });

  it('recusa ponto inativo, produto inativo, produto repetido e perfil errado', async () => {
    const s = await scenario();
    const inactivePoint = await createPoint(null, 1000, 'Ponto Fechado');
    await prisma.pickupPoint.update({ where: { id: inactivePoint.id }, data: { active: false } });
    const send = (body: object, who = s.consumers[0]) => api().post('/api/orders').set(who.auth).send(body);

    expect((await send({ pontoRetiradaId: inactivePoint.id, itens: [{ produtoId: s.productA.id, quantidade: 1 }] })).body.erro.codigo).toBe('PONTO_INATIVO');
    expect((await send({ pontoRetiradaId: 999, itens: [{ produtoId: s.productA.id, quantidade: 1 }] })).status).toBe(404);

    await prisma.product.update({ where: { id: s.productA2.id }, data: { active: false } });
    expect((await send({ pontoRetiradaId: s.point.id, itens: [{ produtoId: s.productA2.id, quantidade: 1 }] })).body.erro.codigo).toBe('PRODUTO_INATIVO');
    expect((await send({ pontoRetiradaId: s.point.id, itens: [{ produtoId: 999, quantidade: 1 }] })).body.erro.codigo).toBe('PRODUTO_INATIVO');

    const repeated = await send({ pontoRetiradaId: s.point.id, itens: [{ produtoId: s.productA.id, quantidade: 1 }, { produtoId: s.productA.id, quantidade: 2 }] });
    expect(repeated.status).toBe(400);

    expect((await send({ pontoRetiradaId: s.point.id, itens: [] })).status).toBe(400);
    expect((await send({ pontoRetiradaId: s.point.id, itens: [{ produtoId: s.productA.id, quantidade: 0 }] })).status).toBe(400);
    expect((await send({ pontoRetiradaId: s.point.id, itens: [{ produtoId: s.productA.id, quantidade: 1.5 }] })).status).toBe(400);

    expect((await send({ pontoRetiradaId: s.point.id, itens: [{ produtoId: s.productA.id, quantidade: 1 }] }, s.attendant)).status).toBe(403);
    expect((await send({ pontoRetiradaId: s.point.id, itens: [{ produtoId: s.productA.id, quantidade: 1 }] }, s.admin)).status).toBe(403);
  });

  it('o preço do pedido não muda se o produtor editar o produto depois', async () => {
    const s = await scenario();
    const order = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    await patch(`/products/${s.productA.id}`, s.producerA, { preco: 99 }).expect(200);

    const res = await api().get(`/api/orders/${order.id}`).set(s.consumers[0].auth);
    expect(res.body.subtotal).toBe(35);
    expect(res.body.itens[0].precoUnitario).toBe(35);
  });
});

describe('consultas de pedidos', () => {
  it('cada um vê só os seus pedidos', async () => {
    const s = await scenario();
    const o1 = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    await placeOrder(s.consumers[1], s.point.id, [{ produtoId: s.productB.id, quantidade: 1 }]);

    const mine = await api().get('/api/orders/my').set(s.consumers[0].auth);
    expect(mine.body.data.map((o: { id: number }) => o.id)).toEqual([o1.id]);

    const producerA = await api().get('/api/producer/orders').set(s.producerA.auth);
    expect(producerA.body.meta.total).toBe(1);

    const filtered = await api().get('/api/producer/orders?status=ACEITO').set(s.producerA.auth);
    expect(filtered.body.meta.total).toBe(0);

    expect((await api().get('/api/producer/orders').set(s.consumers[0].auth)).status).toBe(403);
    expect((await api().get('/api/orders/my?status=INVENTADO').set(s.consumers[0].auth)).status).toBe(400);
  });

  it('GET /orders/:id só para envolvidos', async () => {
    const s = await scenario();
    const order = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    const get = (who: { auth: Record<string, string> }) => api().get(`/api/orders/${order.id}`).set(who.auth);

    expect((await get(s.consumers[0])).status).toBe(200);
    expect((await get(s.producerA)).status).toBe(200);
    expect((await get(s.attendant)).status).toBe(200);
    expect((await get(s.admin)).status).toBe(200);
    expect((await get(s.consumers[1])).status).toBe(404);
    expect((await get(s.producerB)).status).toBe(404);
    expect((await api().get(`/api/orders/${order.id}`)).status).toBe(401);
  });
});

describe('aceite e recusa (RN04)', () => {
  it('só o produtor dono aceita ou recusa', async () => {
    const s = await scenario();
    const order = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);

    expect((await patch(`/orders/${order.id}/accept`, s.producerB)).status).toBe(403);
    expect((await patch(`/orders/${order.id}/accept`, s.consumers[0])).status).toBe(403);
    expect((await patch(`/orders/${order.id}/reject`, s.producerB)).status).toBe(403);
    expect((await patch(`/orders/999/accept`, s.producerA)).status).toBe(404);
  });

  it('recusar devolve o estoque e guarda o motivo', async () => {
    const s = await scenario();
    const order = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 3 }]);
    expect(await stockOf(s.productA.id)).toBe(7);

    const res = await patch(`/orders/${order.id}/reject`, s.producerA, { motivo: 'Sem filamento' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'REJEITADO', motivoRecusa: 'Sem filamento', taxaEstimada: null, total: 105 });
    expect(await stockOf(s.productA.id)).toBe(10);

    // Recusar sem corpo também funciona.
    const other = await placeOrder(s.consumers[1], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    expect((await api().patch(`/api/orders/${other.id}/reject`).set(s.producerA.auth)).status).toBe(200);
  });

  it('não aceita duas vezes nem aceita pedido recusado', async () => {
    const s = await scenario();
    const order = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);

    await patch(`/orders/${order.id}/accept`, s.producerA).expect(200);
    const again = await patch(`/orders/${order.id}/accept`, s.producerA);
    expect(again.status).toBe(409);
    expect(again.body.erro.codigo).toBe('TRANSICAO_INVALIDA');
    expect((await patch(`/orders/${order.id}/reject`, s.producerA)).status).toBe(409);
  });

  it('cliques duplos simultâneos no aceite contam uma vez só', async () => {
    const s = await scenario();
    const order = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);

    const results = await Promise.all([1, 2, 3].map(() => patch(`/orders/${order.id}/accept`, s.producerA)));
    expect(results.filter(r => r.status === 200)).toHaveLength(1);
    expect(await prisma.orderStatusHistory.count({ where: { orderId: order.id, toStatus: 'ACEITO' } })).toBe(1);
  });

  it('após 48 h sem resposta o pedido é cancelado e o estoque volta', async () => {
    const s = await scenario();
    const order = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 4 }]);
    await prisma.order.update({ where: { id: order.id }, data: { acceptDeadline: new Date(Date.now() - 1000) } });

    const accept = await patch(`/orders/${order.id}/accept`, s.producerA);
    expect(accept.status).toBe(409);
    expect(accept.body.erro.codigo).toBe('PRAZO_EXPIRADO');

    const res = await api().get(`/api/orders/${order.id}`).set(s.consumers[0].auth);
    expect(res.body).toMatchObject({ status: 'CANCELADO', motivoCancelamento: 'PRAZO_EXPIRADO' });
    expect(await stockOf(s.productA.id)).toBe(10);

    const history = await prisma.orderStatusHistory.findFirstOrThrow({ where: { orderId: order.id, toStatus: 'CANCELADO' } });
    expect(history.changedById).toBeNull();
    expect(await prisma.auditLog.count({ where: { action: 'PEDIDO_EXPIRADO' } })).toBe(1);
  });
});

describe('status da produção', () => {
  it('segue a ordem ACEITO → EM_PRODUCAO → PRONTO_PARA_ENTREGA', async () => {
    const s = await scenario();
    const order = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);

    expect((await patch(`/orders/${order.id}/status`, s.producerA, { status: 'EM_PRODUCAO' })).status).toBe(409);
    await patch(`/orders/${order.id}/accept`, s.producerA).expect(200);
    expect((await patch(`/orders/${order.id}/status`, s.producerA, { status: 'PRONTO_PARA_ENTREGA' })).status).toBe(409);
    expect((await patch(`/orders/${order.id}/status`, s.producerA, { status: 'RETIRADO' })).status).toBe(400);
    expect((await patch(`/orders/${order.id}/status`, s.producerB, { status: 'EM_PRODUCAO' })).status).toBe(403);

    expect((await patch(`/orders/${order.id}/status`, s.producerA, { status: 'EM_PRODUCAO' })).body.status).toBe('EM_PRODUCAO');
    expect((await patch(`/orders/${order.id}/status`, s.producerA, { status: 'PRONTO_PARA_ENTREGA' })).body.status).toBe('PRONTO_PARA_ENTREGA');

    const history = await prisma.orderStatusHistory.findMany({ where: { orderId: order.id }, orderBy: { id: 'asc' } });
    expect(history.map(h => h.toStatus)).toEqual(['AGUARDANDO_ACEITACAO', 'ACEITO', 'EM_PRODUCAO', 'PRONTO_PARA_ENTREGA']);
  });
});

describe('cancelamento pelo consumidor (RN05)', () => {
  it('cancela antes do aceite e devolve o estoque', async () => {
    const s = await scenario();
    const order = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 2 }]);

    expect((await patch(`/orders/${order.id}/cancel`, s.consumers[1])).status).toBe(403);
    const res = await patch(`/orders/${order.id}/cancel`, s.consumers[0]);
    expect(res.body).toMatchObject({ status: 'CANCELADO', motivoCancelamento: 'CONSUMIDOR' });
    expect(await stockOf(s.productA.id)).toBe(10);
    expect((await patch(`/orders/${order.id}/cancel`, s.consumers[0])).status).toBe(409);
  });

  it('cancela pedido aceito com lote em formação e sai da conta do lote', async () => {
    const s = await scenario();
    const o1 = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    const o2 = await placeOrder(s.consumers[1], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    await patch(`/orders/${o1.id}/accept`, s.producerA).expect(200);
    await patch(`/orders/${o2.id}/accept`, s.producerA).expect(200);

    await patch(`/orders/${o1.id}/cancel`, s.consumers[0]).expect(200);

    const batch = (await api().get('/api/batches').set(s.admin.auth)).body.data[0];
    expect(batch.quantidadePedidos).toBe(1);
    expect((await api().get(`/api/orders/${o2.id}`).set(s.consumers[1].auth)).body.taxaEstimada).toBe(18);
  });

  it('não cancela em produção nem com lote fechado', async () => {
    const s = await scenario();
    const inProduction = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    await patch(`/orders/${inProduction.id}/accept`, s.producerA).expect(200);
    await patch(`/orders/${inProduction.id}/status`, s.producerA, { status: 'EM_PRODUCAO' }).expect(200);

    const res = await patch(`/orders/${inProduction.id}/cancel`, s.consumers[0]);
    expect(res.status).toBe(409);
    expect(res.body.erro.codigo).toBe('CANCELAMENTO_NAO_PERMITIDO');

    // Fecha o lote com mais dois pedidos e tenta cancelar um ainda ACEITO.
    const o2 = await placeOrder(s.consumers[1], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    const o3 = await placeOrder(s.consumers[2], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    await patch(`/orders/${o2.id}/accept`, s.producerA).expect(200);
    await patch(`/orders/${o3.id}/accept`, s.producerA).expect(200);

    expect((await patch(`/orders/${o3.id}/cancel`, s.consumers[2])).body.erro.codigo).toBe('CANCELAMENTO_NAO_PERMITIDO');
  });
});
