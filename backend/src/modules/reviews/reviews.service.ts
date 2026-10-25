import { prisma } from '../../lib/prisma.js';
import { conflict, forbidden, notFound } from '../../lib/errors.js';
import { audit } from '../../lib/audit.js';
import { paginated, skipTake, type Pagination } from '../../lib/pagination.js';
import type { AuthUser } from '../../middlewares/auth.js';
import { Prisma } from '../../generated/prisma/client.js';

export type ReviewInput = { pedidoId: number; produtoId: number; nota: number; comentario?: string };

const include = {
  consumer: { select: { name: true } },
  product: { select: { name: true } },
} satisfies Prisma.ReviewInclude;

// "Maria Souza" → "Maria S.": mostra quem avaliou sem expor o nome completo.
function shortName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

const toAvaliacao = (r: Prisma.ReviewGetPayload<{ include: typeof include }>) => ({
  id: r.id,
  nota: r.rating,
  comentario: r.comment,
  autor: shortName(r.consumer.name),
  produtoId: r.productId,
  produto: r.product.name,
  pedidoId: r.orderId,
  data: r.createdAt,
});

// RN08: só quem retirou o pedido avalia, uma vez por produto.
export async function create(user: AuthUser, input: ReviewInput) {
  const order = await prisma.order.findUnique({ where: { id: input.pedidoId }, include: { items: true } });
  if (!order) throw notFound('Pedido não encontrado.');
  if (order.consumerId !== user.id) throw forbidden('Só quem fez o pedido pode avaliar.');
  if (order.status !== 'RETIRADO') {
    throw conflict('PEDIDO_NAO_RETIRADO', 'A avaliação fica disponível depois da retirada do pedido.');
  }
  if (!order.items.some(i => i.productId === input.produtoId)) {
    throw conflict('PRODUTO_FORA_DO_PEDIDO', 'Este produto não faz parte do pedido.');
  }

  try {
    const review = await prisma.review.create({
      data: {
        consumerId: user.id,
        orderId: order.id,
        productId: input.produtoId,
        rating: input.nota,
        comment: input.comentario || null,
      },
      include,
    });
    await audit({ userId: user.id, action: 'AVALIACAO_CRIADA', entity: 'avaliacao', entityId: review.id });
    return toAvaliacao(review);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw conflict('JA_AVALIADO', 'Você já avaliou este produto neste pedido.');
    }
    throw error;
  }
}

async function listWhere(where: Prisma.ReviewWhereInput, page: Pagination) {
  const [rows, total, summary] = await Promise.all([
    prisma.review.findMany({ where, include, orderBy: { createdAt: 'desc' }, ...skipTake(page) }),
    prisma.review.count({ where }),
    prisma.review.aggregate({ where, _avg: { rating: true } }),
  ]);
  const avg = summary._avg.rating;
  return {
    ...paginated(rows.map(toAvaliacao), total, page),
    resumo: { notaMedia: avg === null ? null : Math.round(avg * 10) / 10, totalAvaliacoes: total },
  };
}

export async function listForProduct(productId: number, page: Pagination) {
  if (!(await prisma.product.findUnique({ where: { id: productId } }))) throw notFound('Produto não encontrado.');
  return listWhere({ productId }, page);
}

// A nota do produtor é a média das avaliações dos produtos dele.
export async function listForProducer(producerId: number, page: Pagination) {
  const producer = await prisma.user.findUnique({ where: { id: producerId } });
  if (producer?.role !== 'PRODUTOR') throw notFound('Produtor não encontrado.');
  return listWhere({ product: { producerId } }, page);
}
