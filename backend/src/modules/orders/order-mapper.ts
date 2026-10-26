import { maxShare, toReais, toReaisOrNull } from '../../lib/money.js';
import { activeOrders, batchCode } from '../batches/batch-rules.js';
import type { Prisma } from '../../generated/prisma/client.js';

const batchCount = { _count: { select: { orders: activeOrders } } };

export const orderInclude = {
  consumer: { select: { name: true, phone: true } },
  producer: { select: { name: true } },
  pickupPoint: {
    select: {
      name: true,
      deliveryCostCents: true,
      batches: { where: { status: 'EM_FORMACAO' }, take: 1, select: { deliveryCostCents: true, ...batchCount } },
    },
  },
  batch: { select: { id: true, status: true, deliveryCostCents: true, ...batchCount } },
  items: { include: { product: { select: { name: true } } }, orderBy: { id: 'asc' } },
  reviews: { select: { productId: true } },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

// RN17: antes do lote fechar, mostra o máximo que o pedido pode pagar.
function estimatedShare(order: OrderRow): number | null {
  if (order.status === 'REJEITADO' || order.status === 'CANCELADO') return null;
  if (order.deliveryShareCents !== null) return order.deliveryShareCents;

  if (order.batch) return maxShare(order.batch.deliveryCostCents, order.batch._count.orders);

  // Ainda não aceito: entraria no lote aberto como mais um pedido.
  const open = order.pickupPoint.batches[0];
  if (open) return maxShare(open.deliveryCostCents, open._count.orders + 1);
  return order.pickupPoint.deliveryCostCents;
}

export function toPedido(order: OrderRow) {
  const estimate = estimatedShare(order);
  const reviewed = new Set(order.reviews.map(r => r.productId));

  return {
    id: order.id,
    data: order.createdAt,
    status: order.status,

    produtor: order.producer.name,
    produtorId: order.producerId,
    cliente: order.consumer.name,
    clienteId: order.consumerId,
    // Contato para o produtor e o atendente (não há chat no MVP).
    clienteTelefone: order.consumer.phone,
    produtos: order.items.map(i => i.product.name),
    itens: order.items.map(i => ({
      produtoId: i.productId,
      nome: i.product.name,
      quantidade: i.quantity,
      precoUnitario: toReais(i.unitPriceCents),
      subtotal: toReais(i.unitPriceCents * i.quantity),
      avaliado: reviewed.has(i.productId),
    })),

    pontoRetirada: order.pickupPoint.name,
    pontoRetiradaId: order.pickupPointId,
    lote: order.batch ? batchCode(order.batch.id) : null,
    loteId: order.batchId,
    loteStatus: order.batch?.status ?? null,

    subtotal: toReais(order.productsTotalCents),
    taxaEntrega: toReaisOrNull(order.deliveryShareCents),
    taxaEstimada: toReaisOrNull(estimate),
    total: toReais(order.productsTotalCents + (estimate ?? 0)),
    taxaDefinitiva: order.deliveryShareCents !== null,

    prazoAceite: order.acceptDeadline,
    aceitoEm: order.acceptedAt,
    motivoRecusa: order.rejectionReason,
    motivoCancelamento: order.cancelReason,
    avaliado: order.status === 'RETIRADO' && order.items.every(i => reviewed.has(i.productId)),
  };
}
