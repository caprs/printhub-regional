import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { api, patch, placeOrder, resetDatabase, scenario } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

type S = Awaited<ReturnType<typeof scenario>>;

// Leva um pedido (2 produtos do produtor A) até a retirada.
async function pickedUpOrder(s: S) {
  const orders = [];
  for (const i of [0, 1, 2]) {
    const items = i === 0 ? [{ produtoId: s.productA.id, quantidade: 1 }, { produtoId: s.productA2.id, quantidade: 1 }] : [{ produtoId: s.productA.id, quantidade: 1 }];
    const order = await placeOrder(s.consumers[i], s.point.id, items);
    await patch(`/orders/${order.id}/accept`, s.producerA).expect(200);
    orders.push(order);
  }
  const id = orders[0].id;
  await patch(`/orders/${id}/status`, s.producerA, { status: 'EM_PRODUCAO' }).expect(200);
  await patch(`/orders/${id}/status`, s.producerA, { status: 'PRONTO_PARA_ENTREGA' }).expect(200);
  await patch(`/orders/${id}/received`, s.attendant).expect(200);
  await patch(`/orders/${id}/picked-up`, s.attendant).expect(200);
  return id;
}

const review = (s: S, who = s.consumers[0]) => (body: object) => api().post('/api/reviews').set(who.auth).send(body);

describe('POST /api/reviews (RN08)', () => {
  it('avalia cada produto de pedido retirado, uma vez só', async () => {
    const s = await scenario();
    const id = await pickedUpOrder(s);
    const send = review(s);

    const res = await send({ pedidoId: id, produtoId: s.productA.id, nota: 5, comentario: 'Ótimo acabamento' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nota: 5, comentario: 'Ótimo acabamento', produto: 'Produto A' });

    const again = await send({ pedidoId: id, produtoId: s.productA.id, nota: 3 });
    expect(again.status).toBe(409);
    expect(again.body.erro.codigo).toBe('JA_AVALIADO');

    let order = (await api().get(`/api/orders/${id}`).set(s.consumers[0].auth)).body;
    expect(order.avaliado).toBe(false);

    await send({ pedidoId: id, produtoId: s.productA2.id, nota: 4 }).expect(201);
    order = (await api().get(`/api/orders/${id}`).set(s.consumers[0].auth)).body;
    expect(order.avaliado).toBe(true);
    expect(order.itens.every((i: { avaliado: boolean }) => i.avaliado)).toBe(true);
  });

  it('não avalia antes da retirada', async () => {
    const s = await scenario();
    const order = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    const res = await review(s)({ pedidoId: order.id, produtoId: s.productA.id, nota: 5 });

    expect(res.status).toBe(409);
    expect(res.body.erro.codigo).toBe('PEDIDO_NAO_RETIRADO');
  });

  it('só quem fez o pedido avalia; produto precisa estar no pedido; nota de 1 a 5', async () => {
    const s = await scenario();
    const id = await pickedUpOrder(s);

    expect((await review(s, s.consumers[1])({ pedidoId: id, produtoId: s.productA.id, nota: 5 })).status).toBe(403);
    // RN09: o produtor não avalia os próprios produtos.
    expect((await review(s, s.producerA)({ pedidoId: id, produtoId: s.productA.id, nota: 5 })).status).toBe(403);
    expect((await review(s)({ pedidoId: id, produtoId: s.productB.id, nota: 5 })).body.erro.codigo).toBe('PRODUTO_FORA_DO_PEDIDO');
    expect((await review(s)({ pedidoId: id, produtoId: s.productA.id, nota: 6 })).status).toBe(400);
    expect((await review(s)({ pedidoId: id, produtoId: s.productA.id, nota: 0 })).status).toBe(400);
    expect((await review(s)({ pedidoId: id, produtoId: s.productA.id, nota: 4.5 })).status).toBe(400);
    expect((await review(s)({ pedidoId: 999, produtoId: s.productA.id, nota: 5 })).status).toBe(404);
  });
});

describe('listagem de avaliações', () => {
  it('produto e produtor mostram média e autor abreviado', async () => {
    const s = await scenario();
    await prisma.user.update({ where: { id: s.consumers[0].user.id }, data: { name: 'Maria da Silva Souza' } });
    const id = await pickedUpOrder(s);
    await review(s)({ pedidoId: id, produtoId: s.productA.id, nota: 5 }).expect(201);
    await review(s)({ pedidoId: id, produtoId: s.productA2.id, nota: 4 }).expect(201);

    const product = await api().get(`/api/products/${s.productA.id}/reviews`);
    expect(product.body.resumo).toEqual({ notaMedia: 5, totalAvaliacoes: 1 });
    expect(product.body.data[0].autor).toBe('Maria S.');

    const producer = await api().get(`/api/producers/${s.producerA.user.id}/reviews`);
    expect(producer.body.resumo).toEqual({ notaMedia: 4.5, totalAvaliacoes: 2 });

    const catalog = await api().get(`/api/products/${s.productA.id}`);
    expect(catalog.body).toMatchObject({ notaMedia: 5, totalAvaliacoes: 1 });

    expect((await api().get(`/api/producers/${s.consumers[0].user.id}/reviews`)).status).toBe(404);
    expect((await api().get('/api/products/999/reviews')).status).toBe(404);
  });
});
