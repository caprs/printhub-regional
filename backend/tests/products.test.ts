import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { api, createUser, resetDatabase, validProduct } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('POST /api/products', () => {
  it('produtor cadastra produto vinculado a ele', async () => {
    const { user, auth } = await createUser('PRODUTOR');
    const res = await api().post('/api/products').set(auth).send(validProduct);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ produtorId: user.id, preco: 29.9, estoque: 10, ativo: true, notaMedia: null });

    const saved = await prisma.product.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(saved.priceCents).toBe(2990);
  });

  it('consumidor não cadastra produto', async () => {
    const { auth } = await createUser('CONSUMIDOR');
    const res = await api().post('/api/products').set(auth).send(validProduct);
    expect(res.status).toBe(403);
  });

  it('RN01: exige preço, prazo, material e imagem', async () => {
    const { auth } = await createUser('PRODUTOR');
    const { preco, prazoProducao, material, imagem, ...rest } = validProduct;
    const res = await api().post('/api/products').set(auth).send(rest);

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.erro.detalhes)).toEqual(
      expect.arrayContaining(['preco', 'prazoProducao', 'material', 'imagem']),
    );
  });

  it('recusa preço com mais de 2 casas decimais', async () => {
    const { auth } = await createUser('PRODUTOR');
    const res = await api().post('/api/products').set(auth).send({ ...validProduct, preco: 10.555 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/products', () => {
  it('filtra, ordena e pagina', async () => {
    const { auth } = await createUser('PRODUTOR');
    await api().post('/api/products').set(auth).send({ ...validProduct, nome: 'Vaso alto', material: 'PETG', preco: 50 });
    await api().post('/api/products').set(auth).send({ ...validProduct, nome: 'Vaso baixo', material: 'PLA', preco: 20 });
    await api().post('/api/products').set(auth).send({ ...validProduct, nome: 'Suporte', material: 'PLA', preco: 15 });

    const search = await api().get('/api/products?busca=vaso&ordenar=preco_asc');
    expect(search.body.data.map((p: { nome: string }) => p.nome)).toEqual(['Vaso baixo', 'Vaso alto']);

    const byMaterial = await api().get('/api/products?material=pla&precoMax=18');
    expect(byMaterial.body.data.map((p: { nome: string }) => p.nome)).toEqual(['Suporte']);

    const page = await api().get('/api/products?porPagina=2&pagina=2');
    expect(page.body.meta).toEqual({ pagina: 2, porPagina: 2, total: 3, totalPaginas: 2 });
    expect(page.body.data).toHaveLength(1);
  });

  it('não mostra produto desativado', async () => {
    const { auth } = await createUser('PRODUTOR');
    const created = await api().post('/api/products').set(auth).send(validProduct);
    await api().delete(`/api/products/${created.body.id}`).set(auth).expect(204);

    expect((await api().get('/api/products')).body.meta.total).toBe(0);
    expect((await api().get(`/api/products/${created.body.id}`)).status).toBe(404);

    const mine = await api().get('/api/producers/me/products').set(auth);
    expect(mine.body.data[0]).toMatchObject({ id: created.body.id, ativo: false });
  });
});

describe('PATCH /api/products/:id', () => {
  it('dono altera só os campos enviados', async () => {
    const { auth } = await createUser('PRODUTOR');
    const created = await api().post('/api/products').set(auth).send(validProduct);

    const res = await api().patch(`/api/products/${created.body.id}`).set(auth).send({ preco: 32, estoque: 4 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ preco: 32, estoque: 4, nome: validProduct.nome });
  });

  it('outro produtor não altera', async () => {
    const owner = await createUser('PRODUTOR', 'dono@teste.local');
    const other = await createUser('PRODUTOR', 'outro@teste.local');
    const created = await api().post('/api/products').set(owner.auth).send(validProduct);

    const res = await api().patch(`/api/products/${created.body.id}`).set(other.auth).send({ preco: 1 });
    expect(res.status).toBe(403);
  });
});
