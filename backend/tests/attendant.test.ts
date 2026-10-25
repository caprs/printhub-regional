import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { api, createPoint, createUser, patch, placeOrder, resetDatabase, scenario } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

type S = Awaited<ReturnType<typeof scenario>>;

// Pedido aceito e pronto. Com closeBatch = true, outros 2 pedidos fecham o lote.
async function readyOrder(s: S, closeBatch: boolean) {
  const ids: number[] = [];
  for (const i of closeBatch ? [0, 1, 2] : [0]) {
    const order = await placeOrder(s.consumers[i], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    await patch(`/orders/${order.id}/accept`, s.producerA).expect(200);
    ids.push(order.id);
  }
  await patch(`/orders/${ids[0]}/status`, s.producerA, { status: 'EM_PRODUCAO' }).expect(200);
  await patch(`/orders/${ids[0]}/status`, s.producerA, { status: 'PRONTO_PARA_ENTREGA' }).expect(200);
  return ids[0];
}

describe('recebimento no ponto (RN19)', () => {
  it('o atendente do ponto confirma o recebimento de lote fechado', async () => {
    const s = await scenario();
    const id = await readyOrder(s, true);

    const res = await patch(`/orders/${id}/received`, s.attendant);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DISPONIVEL_RETIRADA');
  });

  it('recusa recebimento com o lote ainda em formação', async () => {
    const s = await scenario();
    const id = await readyOrder(s, false);

    const res = await patch(`/orders/${id}/received`, s.attendant);
    expect(res.status).toBe(409);
    expect(res.body.erro.codigo).toBe('LOTE_EM_FORMACAO');
  });

  it('recusa pedido que ainda não está pronto', async () => {
    const s = await scenario();
    const order = await placeOrder(s.consumers[0], s.point.id, [{ produtoId: s.productA.id, quantidade: 1 }]);
    await patch(`/orders/${order.id}/accept`, s.producerA).expect(200);

    expect((await patch(`/orders/${order.id}/received`, s.attendant)).body.erro.codigo).toBe('TRANSICAO_INVALIDA');
  });
});

describe('retirada (RN07)', () => {
  it('só o atendente do ponto confirma; precisa ter recebido antes', async () => {
    const s = await scenario();
    const otherAttendant = await createUser('ATENDENTE');
    await createPoint(otherAttendant.user.id, 2400, 'Ponto Bairro');
    const id = await readyOrder(s, true);

    expect((await patch(`/orders/${id}/picked-up`, s.attendant)).status).toBe(409);
    expect((await patch(`/orders/${id}/received`, otherAttendant)).status).toBe(403);
    expect((await patch(`/orders/${id}/received`, s.producerA)).status).toBe(403);
    expect((await patch(`/orders/${id}/received`, s.admin)).status).toBe(403);

    await patch(`/orders/${id}/received`, s.attendant).expect(200);
    expect((await patch(`/orders/${id}/picked-up`, otherAttendant)).status).toBe(403);
    expect((await patch(`/orders/${id}/picked-up`, s.consumers[0])).status).toBe(403);

    const res = await patch(`/orders/${id}/picked-up`, s.attendant);
    expect(res.body.status).toBe('RETIRADO');
    expect((await patch(`/orders/${id}/picked-up`, s.attendant)).status).toBe(409);
  });
});

describe('GET /api/attendant/orders', () => {
  it('mostra os pedidos do ponto que estão a caminho, no ponto ou retirados', async () => {
    const s = await scenario();
    const id = await readyOrder(s, true);

    const list = await api().get('/api/attendant/orders').set(s.attendant.auth);
    expect(list.body.data.map((o: { id: number }) => o.id)).toEqual([id]);
    expect(list.body.data[0]).toMatchObject({ status: 'PRONTO_PARA_ENTREGA', loteStatus: 'AGUARDANDO_PRODUCAO', cliente: expect.any(String) });

    const accepted = await api().get('/api/attendant/orders?status=ACEITO').set(s.attendant.auth);
    expect(accepted.body.meta.total).toBe(2);
  });

  it('atendente sem ponto recebe 403', async () => {
    const lonely = await createUser('ATENDENTE');
    expect((await api().get('/api/attendant/orders').set(lonely.auth)).status).toBe(403);
  });
});
