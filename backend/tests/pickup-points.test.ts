import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { api, createUser, patch, placeOrder, resetDatabase, scenario } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const newPoint = { nome: 'Ponto Vila', endereco: 'Rua B, 20', bairro: 'Vila', cidade: 'Ourinhos - SP', custoEntrega: 24 };

describe('pontos de retirada', () => {
  it('admin cadastra, edita e desativa; a lista pública só mostra ativos', async () => {
    const admin = await createUser('ADMINISTRADOR');
    const attendant = await createUser('ATENDENTE');

    const created = await api().post('/api/pickup-points').set(admin.auth).send({ ...newPoint, atendenteId: attendant.user.id });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      nome: 'Ponto Vila',
      custoEntrega: 24,
      ativo: true,
      atendenteId: attendant.user.id,
      loteAberto: null,
      taxaEstimada: { maxima: 24, minima: 8 },
    });

    const edited = await patch(`/pickup-points/${created.body.id}`, admin, { custoEntrega: 19.5 });
    expect(edited.body.custoEntrega).toBe(19.5);

    await api().delete(`/api/pickup-points/${created.body.id}`).set(admin.auth).expect(204);
    expect((await api().get('/api/pickup-points')).body).toHaveLength(0);
    expect((await api().get('/api/pickup-points?todos=true').set(admin.auth)).body).toHaveLength(1);
    // Sem login, ?todos=true é ignorado.
    expect((await api().get('/api/pickup-points?todos=true')).body).toHaveLength(0);

    await patch(`/pickup-points/${created.body.id}`, admin, { ativo: true }).expect(200);
    expect((await api().get('/api/pickup-points')).body).toHaveLength(1);
    expect(await prisma.auditLog.count({ where: { entity: 'ponto_retirada' } })).toBe(4);
  });

  it('só admin altera pontos', async () => {
    const producer = await createUser('PRODUTOR');
    expect((await api().post('/api/pickup-points').set(producer.auth).send(newPoint)).status).toBe(403);
    expect((await api().post('/api/pickup-points').send(newPoint)).status).toBe(401);
  });

  it('valida o atendente escolhido', async () => {
    const admin = await createUser('ADMINISTRADOR');
    const consumer = await createUser('CONSUMIDOR');
    const attendant = await createUser('ATENDENTE');

    const notAttendant = await api().post('/api/pickup-points').set(admin.auth).send({ ...newPoint, atendenteId: consumer.user.id });
    expect(notAttendant.body.erro.codigo).toBe('ATENDENTE_INVALIDO');

    const first = await api().post('/api/pickup-points').set(admin.auth).send({ ...newPoint, atendenteId: attendant.user.id });
    const busy = await api().post('/api/pickup-points').set(admin.auth).send({ ...newPoint, atendenteId: attendant.user.id });
    expect(busy.body.erro.codigo).toBe('ATENDENTE_EM_USO');

    // Reenviar o mesmo atendente para o próprio ponto não é conflito.
    expect((await patch(`/pickup-points/${first.body.id}`, admin, { atendenteId: attendant.user.id })).status).toBe(200);
    expect((await patch(`/pickup-points/${first.body.id}`, admin, { atendenteId: null })).body.atendenteId).toBeNull();
  });

  it('valida campos e custo', async () => {
    const admin = await createUser('ADMINISTRADOR');
    const res = await api().post('/api/pickup-points').set(admin.auth).send({ nome: 'X', custoEntrega: -1 });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.erro.detalhes)).toEqual(expect.arrayContaining(['nome', 'endereco', 'bairro', 'cidade', 'custoEntrega']));
    expect((await patch('/pickup-points/999', admin, { nome: 'Novo nome' })).status).toBe(404);
    expect((await patch('/pickup-points/1', admin, {})).status).toBe(400);
  });

  it('mostra o lote aberto e a taxa estimada para o checkout', async () => {
    const s = await scenario();
    const order = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    await patch(`/orders/${order.id}/accept`, s.producerA).expect(200);

    const [point] = (await api().get('/api/pickup-points')).body;
    expect(point.loteAberto).toMatchObject({ codigo: 'LOTE-001', quantidadePedidos: 1 });
    expect(point.taxaEstimada).toEqual({ maxima: 9, minima: 6 });

    // Um pedido novo, ainda pendente, mostra a mesma estimativa.
    const pending = await placeOrder(s.consumers[1], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    expect(pending.taxaEstimada).toBe(9);
  });
});
