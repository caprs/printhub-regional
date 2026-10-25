import { prisma } from '../../lib/prisma.js';
import { conflict, notFound } from '../../lib/errors.js';
import { audit } from '../../lib/audit.js';
import { maxShare, toCents, toReais } from '../../lib/money.js';
import { BATCH_SIZE, activeOrders, batchCode } from '../batches/batch-rules.js';
import type { Prisma } from '../../generated/prisma/client.js';

const include = {
  responsible: { select: { name: true } },
  batches: {
    where: { status: 'EM_FORMACAO' },
    take: 1,
    include: { _count: { select: { orders: activeOrders } } },
  },
} satisfies Prisma.PickupPointInclude;

type PointRow = Prisma.PickupPointGetPayload<{ include: typeof include }>;

export type PointInput = {
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  custoEntrega: number;
  atendenteId?: number | null;
  ativo?: boolean;
};

// Estimativa da taxa para quem vai pedir agora (o pedido ainda entraria no lote).
function toPonto(p: PointRow) {
  const open = p.batches[0];
  const count = open?._count.orders ?? 0;
  const cost = open?.deliveryCostCents ?? p.deliveryCostCents;

  return {
    id: p.id,
    nome: p.name,
    endereco: p.address,
    bairro: p.district,
    cidade: p.city,
    custoEntrega: toReais(p.deliveryCostCents),
    ativo: p.active,
    atendenteId: p.responsibleUserId,
    atendente: p.responsible?.name ?? null,
    loteAberto: open
      ? { id: open.id, codigo: batchCode(open.id), quantidadePedidos: count, dataLimite: open.deadline }
      : null,
    // Máxima: o lote fecha sem mais ninguém. Mínima: o lote enche (3 pedidos).
    taxaEstimada: {
      maxima: toReais(maxShare(cost, count + 1)),
      minima: toReais(maxShare(cost, BATCH_SIZE)),
    },
  };
}

export async function list(includeInactive: boolean) {
  const points = await prisma.pickupPoint.findMany({
    where: includeInactive ? {} : { active: true },
    include,
    orderBy: { name: 'asc' },
  });
  return points.map(toPonto);
}

export async function get(id: number, includeInactive: boolean) {
  const point = await prisma.pickupPoint.findUnique({ where: { id }, include });
  if (!point || (!point.active && !includeInactive)) throw notFound('Ponto de retirada não encontrado.');
  return toPonto(point);
}

// O atendente precisa existir, ter o perfil ATENDENTE e não cuidar de outro ponto.
async function checkAttendant(attendantId: number, pointId?: number) {
  const user = await prisma.user.findUnique({ where: { id: attendantId }, include: { pickupPoint: true } });
  if (!user || user.role !== 'ATENDENTE' || !user.active) {
    throw conflict('ATENDENTE_INVALIDO', 'O usuário escolhido não é um atendente ativo.');
  }
  if (user.pickupPoint && user.pickupPoint.id !== pointId) {
    throw conflict('ATENDENTE_EM_USO', `Este atendente já responde pelo ${user.pickupPoint.name}.`);
  }
}

function toData(input: Partial<PointInput>) {
  return {
    name: input.nome,
    address: input.endereco,
    district: input.bairro,
    city: input.cidade,
    deliveryCostCents: input.custoEntrega === undefined ? undefined : toCents(input.custoEntrega),
    responsibleUserId: input.atendenteId,
    active: input.ativo,
  };
}

export async function create(adminId: number, input: PointInput) {
  if (input.atendenteId) await checkAttendant(input.atendenteId);

  const point = await prisma.pickupPoint.create({
    data: toData(input) as Prisma.PickupPointUncheckedCreateInput,
    include,
  });
  await audit({ userId: adminId, action: 'PONTO_CRIADO', entity: 'ponto_retirada', entityId: point.id, data: { ...input } });
  return toPonto(point);
}

// Mudar o custo não altera lotes já abertos: o lote guarda o custo do dia em que abriu.
export async function update(adminId: number, id: number, input: Partial<PointInput>) {
  const existing = await prisma.pickupPoint.findUnique({ where: { id } });
  if (!existing) throw notFound('Ponto de retirada não encontrado.');
  if (input.atendenteId) await checkAttendant(input.atendenteId, id);

  const point = await prisma.pickupPoint.update({ where: { id }, data: toData(input), include });
  await audit({ userId: adminId, action: 'PONTO_ALTERADO', entity: 'ponto_retirada', entityId: id, data: { ...input } });
  return toPonto(point);
}

export async function deactivate(adminId: number, id: number) {
  await update(adminId, id, { ativo: false });
}
