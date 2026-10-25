// Fluxo principal de ponta a ponta, só pela API, como o Angular vai usar:
// produtor cadastra → consumidores pedem → produtores aceitam → lote fecha →
// produção → ponto recebe → consumidor retira → avalia.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { api, createUser, resetDatabase } from './helpers.js';

afterAll(() => prisma.$disconnect());

const register = async (nome: string, email: string, perfil: string) => {
  const res = await api().post('/api/auth/register').send({ nome, email, senha: 'senha1234', perfil });
  expect(res.status).toBe(201);
  return { id: res.body.usuario.id as number, auth: { Authorization: `Bearer ${res.body.token}` } };
};

describe('fluxo completo', () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let attendant: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    await resetDatabase();
    admin = await createUser('ADMINISTRADOR');
    attendant = await createUser('ATENDENTE');
  });

  it('do cadastro do produto até a avaliação', async () => {
    // Administrador cadastra o ponto com o atendente.
    const point = await api()
      .post('/api/pickup-points')
      .set(admin.auth)
      .send({ nome: 'Ponto Centro', endereco: 'Rua A, 1', bairro: 'Centro', cidade: 'Ourinhos - SP', custoEntrega: 18, atendenteId: attendant.user.id });
    expect(point.status).toBe(201);

    // Dois produtores se cadastram e publicam produtos.
    const ana = await register('Ana Produtora', 'ana@email.com', 'PRODUTOR');
    const bia = await register('Bia Produtora', 'bia@email.com', 'PRODUTOR');
    const product = (who: typeof ana, nome: string, preco: number) =>
      api().post('/api/products').set(who.auth).send({ nome, descricao: 'Peça 3D', categoria: 'Decoração', material: 'PLA', preco, imagem: 'https://placehold.co/600', estoque: 5, prazoProducao: 3 });
    const vaso = (await product(ana, 'Vaso', 48)).body;
    const suporte = (await product(bia, 'Suporte', 22)).body;

    // O catálogo mostra os dois.
    expect((await api().get('/api/products')).body.meta.total).toBe(2);

    // Três consumidores pedem no mesmo ponto.
    const consumers = [];
    for (const n of [1, 2, 3]) consumers.push(await register(`Cliente ${n}`, `cliente${n}@email.com`, 'CONSUMIDOR'));

    const order = (who: typeof ana, produtoId: number) =>
      api().post('/api/orders').set(who.auth).send({ pontoRetiradaId: point.body.id, itens: [{ produtoId, quantidade: 1 }] });
    const o1 = (await order(consumers[0], vaso.id)).body;
    const o2 = (await order(consumers[1], suporte.id)).body;
    const o3 = (await order(consumers[2], vaso.id)).body;
    expect([o1.status, o2.status, o3.status]).toEqual(['AGUARDANDO_ACEITACAO', 'AGUARDANDO_ACEITACAO', 'AGUARDANDO_ACEITACAO']);

    // Os produtores veem e aceitam. O 3º aceite fecha o lote.
    expect((await api().get('/api/producer/orders').set(ana.auth)).body.meta.total).toBe(2);
    await api().patch(`/api/orders/${o1.id}/accept`).set(ana.auth).expect(200);
    await api().patch(`/api/orders/${o2.id}/accept`).set(bia.auth).expect(200);
    const accepted = (await api().patch(`/api/orders/${o3.id}/accept`).set(ana.auth)).body;
    expect(accepted).toMatchObject({ taxaEntrega: 6, taxaDefinitiva: true, total: 54 });

    const batch = (await api().get(`/api/batches/${accepted.loteId}`).set(consumers[0].auth)).body;
    expect(batch).toMatchObject({ status: 'FECHADO', quantidadePedidos: 3, taxaPorPedido: 6 });

    // Produção e envio ao ponto.
    for (const [o, who] of [[o1, ana], [o2, bia], [o3, ana]] as const) {
      await api().patch(`/api/orders/${o.id}/status`).set(who.auth).send({ status: 'EM_PRODUCAO' }).expect(200);
      await api().patch(`/api/orders/${o.id}/status`).set(who.auth).send({ status: 'PRONTO_PARA_ENTREGA' }).expect(200);
    }

    // O atendente vê os 3 chegando, confirma o recebimento e a retirada do primeiro.
    const incoming = (await api().get('/api/attendant/orders?status=PRONTO_PARA_ENTREGA').set(attendant.auth)).body;
    expect(incoming.meta.total).toBe(3);
    await api().patch(`/api/orders/${o1.id}/received`).set(attendant.auth).expect(200);
    const picked = (await api().patch(`/api/orders/${o1.id}/picked-up`).set(attendant.auth)).body;
    expect(picked.status).toBe('RETIRADO');

    // O consumidor vê o pedido retirado e avalia.
    const mine = (await api().get('/api/orders/my').set(consumers[0].auth)).body.data[0];
    expect(mine).toMatchObject({ status: 'RETIRADO', subtotal: 48, taxaEntrega: 6, total: 54, avaliado: false });
    await api().post('/api/reviews').set(consumers[0].auth).send({ pedidoId: o1.id, produtoId: vaso.id, nota: 5 }).expect(201);
    expect((await api().get(`/api/products/${vaso.id}`)).body.notaMedia).toBe(5);

    // O estoque baixou e o dashboard reflete tudo.
    expect((await api().get(`/api/products/${vaso.id}`)).body.estoque).toBe(3);
    const dash = (await api().get('/api/dashboard').set(admin.auth)).body;
    expect(dash.pedidos).toMatchObject({ total: 3, retirados: 1, emAndamento: 2 });
    expect(dash.lotes.fechados).toBe(1);
  });
});
