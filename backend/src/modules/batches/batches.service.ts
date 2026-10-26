import { prisma } from '../../lib/prisma.js';
import { forbidden, notFound } from '../../lib/errors.js';
import { toReais } from '../../lib/money.js';
import { paginated, skipTake, type Pagination } from '../../lib/pagination.js';
import type { AuthUser } from '../../middlewares/auth.js';
import { orderInclude, toPedido } from '../orders/order-mapper.js';
import { BATCH_SIZE, activeOrders, batchCode } from './batch-rules.js';
import type { BatchStatus, Prisma } from '../../generated/prisma/client.js';

const include = {
  pickupPoint: { select: { name: true, responsibleUserId: true } },
  _count: { select: { orders: activeOrders } },
} satisfies Prisma.BatchInclude;

type BatchRow = Prisma.BatchGetPayload<{ include: typeof include }>;

export type BatchFilters = Pagination & { pontoRetiradaId?: number; status?: BatchStatus };

function toLote(b: BatchRow) {
  const count = b._count.orders;
  return {
    id: b.id,
    codigo: batchCode(b.id),
    pontoRetiradaId: b.pickupPointId,
    pontoRetirada: b.pickupPoint.name,
    dataAbertura: b.startDate,
    dataLimite: b.deadline,
    dataFechamento: b.closedAt,
    quantidadePedidos: count,
    capacidade: BATCH_SIZE,
    custoEntrega: toReais(b.deliveryCostCents),
    // Valor de referência; a taxa exata de cada pedido está no próprio pedido.
    taxaPorPedido: count ? Math.round(b.deliveryCostCents / count) / 100 : null,
    taxaDefinitiva: b.status !== 'EM_FORMACAO',
    status: b.status,
  };
}

export async function list(filters: BatchFilters) {
  const where: Prisma.BatchWhereInput = { pickupPointId: filters.pontoRetiradaId, status: filters.status };
  const [rows, total] = await Promise.all([
    prisma.batch.findMany({ where, include, orderBy: { startDate: 'desc' }, ...skipTake(filters) }),
    prisma.batch.count({ where }),
  ]);
  return paginated(rows.map(toLote), total, filters);
}

async function find(id: number) {
  const batch = await prisma.batch.findUnique({ where: { id }, include });
  if (!batch) throw notFound('Lote não encontrado.');
  return batch;
}

export async function get(id: number) {
  return toLote(await find(id));
}

export async function listOrders(id: number, user: AuthUser) {
  const batch = await find(id);
  if (user.role !== 'ADMINISTRADOR' && batch.pickupPoint.responsibleUserId !== user.id) {
    throw forbidden('Somente o administrador ou o atendente do ponto podem ver os pedidos do lote.');
  }

  const orders = await prisma.order.findMany({
    where: { batchId: id, ...activeOrders.where },
    include: orderInclude,
    orderBy: { batchPosition: 'asc' },
  });
  return orders.map(toPedido);
}
