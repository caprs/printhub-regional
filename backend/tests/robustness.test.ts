// Entradas extremas e malformadas: nada pode virar erro 500.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { api, patch, resetDatabase, scenario, validProduct } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('entradas inválidas', () => {
  it('IDs maiores que o banco suporta viram 400', async () => {
    const s = await scenario();
    expect((await api().get('/api/products/99999999999')).status).toBe(400);
    expect((await api().get('/api/orders/99999999999').set(s.consumers[0].auth)).status).toBe(400);

    const order = await api()
      .post('/api/orders')
      .set(s.consumers[0].auth)
      .send({ pontoRetiradaId: 99999999999, itens: [{ produtoId: s.productA.id, quantidade: 1 }] });
    expect(order.status).toBe(400);
    expect((await api().get('/api/products?produtorId=99999999999')).status).toBe(400);
  });

  it('preço, estoque e custo têm teto', async () => {
    const s = await scenario();
    const create = (body: object) => api().post('/api/products').set(s.producerA.auth).send({ ...validProduct, ...body });

    expect((await create({ preco: 99999999 })).status).toBe(400);
    expect((await create({ estoque: 9999999999 })).status).toBe(400);
    expect((await create({ preco: 10000, estoque: 100000 })).status).toBe(201);
    expect((await patch(`/pickup-points/${s.point.id}`, s.admin, { custoEntrega: 5000 })).status).toBe(400);
  });

  it('imagem só aceita http e https', async () => {
    const s = await scenario();
    const create = (imagem: string) => api().post('/api/products').set(s.producerA.auth).send({ ...validProduct, imagem });

    expect((await create('javascript:alert(1)')).status).toBe(400);
    expect((await create('data:image/png;base64,AAAA')).status).toBe(400);
    expect((await create('ftp://exemplo.com/a.png')).status).toBe(400);
    expect((await create('https://placehold.co/600x400')).status).toBe(201);
  });

  it('JSON quebrado é 400 e corpo grande demais é 413', async () => {
    const broken = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(broken.status).toBe(400);
    expect(broken.body.erro.codigo).toBe('JSON_INVALIDO');

    const huge = await api().post('/api/auth/login').send({ email: 'x'.repeat(200_000) });
    expect(huge.status).toBe(413);
  });

  it('rota inexistente devolve 404 em JSON', async () => {
    const res = await api().get('/api/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body.erro.codigo).toBe('ROTA_NAO_ENCONTRADA');
  });
});

describe('token e usuários', () => {
  it('token vencido não bloqueia a lista pública de pontos', async () => {
    await scenario();
    const res = await api().get('/api/pickup-points').set('Authorization', 'Bearer token-vencido');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('produtos de produtor desativado somem do catálogo e não podem ser pedidos', async () => {
    const s = await scenario();
    await prisma.user.update({ where: { id: s.producerB.user.id }, data: { active: false } });

    expect((await api().get(`/api/products/${s.productB.id}`)).status).toBe(404);
    expect((await api().get('/api/products')).body.data.map((p: { id: number }) => p.id)).not.toContain(s.productB.id);

    const order = await api()
      .post('/api/orders')
      .set(s.consumers[0].auth)
      .send({ pontoRetiradaId: s.point.id, itens: [{ produtoId: s.productB.id, quantidade: 1 }] });
    expect(order.body.erro.codigo).toBe('PRODUTO_INATIVO');
  });

  it('produtor reativa um produto excluído', async () => {
    const s = await scenario();
    await api().delete(`/api/products/${s.productA.id}`).set(s.producerA.auth).expect(204);
    const res = await patch(`/products/${s.productA.id}`, s.producerA, { ativo: true });

    expect(res.body.ativo).toBe(true);
    expect((await api().get(`/api/products/${s.productA.id}`)).status).toBe(200);
  });

  it('a senha nunca aparece em nenhuma resposta', async () => {
    const s = await scenario();
    const responses = [
      await api().get('/api/auth/me').set(s.admin.auth),
      await api().get('/api/admin/users').set(s.admin.auth),
      await api().get('/api/products'),
    ];
    for (const res of responses) expect(JSON.stringify(res.body)).not.toMatch(/password|senha|hash/i);
  });
});
