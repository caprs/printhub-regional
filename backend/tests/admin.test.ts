import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { api, createUser, patch, placeOrder, resetDatabase, scenario } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('GET /api/dashboard', () => {
  it('admin vê tudo; produtor vê só o dele', async () => {
    const s = await scenario();
    const orders = [];
    for (const i of [0, 1, 2]) {
      const o = await placeOrder(s.consumers[i], s.point.id, [{ produtoId: s.productA.id, quantidade: i + 1 }]);
      await patch(`/orders/${o.id}/accept`, s.producerA).expect(200);
      orders.push(o);
    }
    const pendingB = await placeOrder(s.consumers[3], s.point.id, [{ produtoId: s.productB.id, quantidade: 1 }]);
    await patch(`/orders/${pendingB.id}/reject`, s.producerB).expect(200);

    const admin = (await api().get('/api/dashboard').set(s.admin.auth)).body;
    expect(admin.pedidos).toMatchObject({ total: 4, emAndamento: 3, retirados: 0, porStatus: { ACEITO: 3, REJEITADO: 1 } });
    expect(admin.produtos.ativos).toBe(3);
    expect(admin.pontosAtivos).toBe(1);
    expect(admin.lotes).toMatchObject({ emFormacao: 0, fechados: 1 });
    // Pedido recusado não conta como venda.
    expect(admin.maisVendidos).toEqual([{ produtoId: s.productA.id, nome: 'Produto A', quantidade: 6 }]);

    const producerB = (await api().get('/api/dashboard').set(s.producerB.auth)).body;
    expect(producerB.pedidos).toMatchObject({ total: 1, emAndamento: 0 });
    expect(producerB.produtos.ativos).toBe(1);
    expect(producerB.lotes.fechados).toBe(0);

    expect((await api().get('/api/dashboard').set(s.consumers[0].auth)).status).toBe(403);
  });
});

describe('usuários (admin)', () => {
  it('cria atendente, lista, filtra e desativa', async () => {
    const admin = await createUser('ADMINISTRADOR');

    const created = await api()
      .post('/api/admin/users')
      .set(admin.auth)
      .send({ nome: 'Atendente Novo', email: 'Novo@Ponto.com', senha: 'senha1234', perfil: 'ATENDENTE' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ email: 'novo@ponto.com', perfil: 'ATENDENTE', ativo: true });
    expect(created.body).not.toHaveProperty('passwordHash');

    const list = await api().get('/api/admin/users?perfil=ATENDENTE').set(admin.auth);
    expect(list.body.meta.total).toBe(1);
    expect((await api().get('/api/admin/users?busca=ponto.com').set(admin.auth)).body.meta.total).toBe(1);

    await patch(`/admin/users/${created.body.id}`, admin, { ativo: false }).expect(200);
    const login = await api().post('/api/auth/login').send({ email: 'novo@ponto.com', senha: 'senha1234' });
    expect(login.status).toBe(401);
    expect((await api().get('/api/admin/users?ativo=false').set(admin.auth)).body.meta.total).toBe(1);
  });

  it('usuário desativado perde o acesso mesmo com token válido', async () => {
    const admin = await createUser('ADMINISTRADOR');
    const consumer = await createUser('CONSUMIDOR');
    await patch(`/admin/users/${consumer.user.id}`, admin, { ativo: false }).expect(200);
    expect((await api().get('/api/auth/me').set(consumer.auth)).status).toBe(401);
  });

  it('a troca de perfil vale na hora, sem novo login', async () => {
    const admin = await createUser('ADMINISTRADOR');
    const user = await createUser('CONSUMIDOR');
    await patch(`/admin/users/${user.user.id}`, admin, { perfil: 'PRODUTOR' }).expect(200);
    expect((await api().get('/api/producers/me/products').set(user.auth)).status).toBe(200);
  });

  it('protege a própria conta e atendente vinculado', async () => {
    const s = await scenario();
    const self = await patch(`/admin/users/${s.admin.user.id}`, s.admin, { ativo: false });
    expect(self.body.erro.codigo).toBe('ALTERACAO_PROPRIA');
    expect((await patch(`/admin/users/${s.admin.user.id}`, s.admin, { perfil: 'CONSUMIDOR' })).status).toBe(409);
    expect((await patch(`/admin/users/${s.admin.user.id}`, s.admin, { nome: 'Novo Nome' })).status).toBe(200);

    const linked = await patch(`/admin/users/${s.attendant.user.id}`, s.admin, { perfil: 'CONSUMIDOR' });
    expect(linked.body.erro.codigo).toBe('ATENDENTE_VINCULADO');
  });

  it('e-mail repetido e perfil não-admin', async () => {
    const admin = await createUser('ADMINISTRADOR', 'admin@teste.local');
    const producer = await createUser('PRODUTOR');
    const dup = await api().post('/api/admin/users').set(admin.auth).send({ nome: 'Outro', email: 'admin@teste.local', senha: 'senha1234', perfil: 'ATENDENTE' });
    expect(dup.status).toBe(409);
    expect((await api().get('/api/admin/users').set(producer.auth)).status).toBe(403);
    expect((await api().get('/api/admin/audit-logs').set(producer.auth)).status).toBe(403);
  });
});

describe('GET /api/admin/audit-logs', () => {
  it('registra as operações críticas com quem fez', async () => {
    const s = await scenario();
    const o = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    await patch(`/orders/${o.id}/accept`, s.producerA).expect(200);

    const logs = await api().get('/api/admin/audit-logs?entidade=pedido').set(s.admin.auth);
    expect(logs.body.data.map((l: { acao: string }) => l.acao)).toEqual(['PEDIDO_ACEITO', 'PEDIDO_CRIADO']);
    expect(logs.body.data[0]).toMatchObject({ usuarioId: s.producerA.user.id, entidadeId: o.id, dados: { de: 'AGUARDANDO_ACEITACAO', para: 'ACEITO' } });

    const logins = await api().get('/api/admin/audit-logs?acao=LOGIN').set(s.admin.auth);
    expect(logins.body.meta.total).toBeGreaterThan(0);
  });
});
