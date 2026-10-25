import { prisma } from '../../lib/prisma.js';
import { forbidden, notFound } from '../../lib/errors.js';
import { toCents, toReais } from '../../lib/money.js';
import { paginated, skipTake, type Pagination } from '../../lib/pagination.js';
import type { Prisma } from '../../generated/prisma/client.js';

const withProducer = { producer: { select: { name: true } } } as const;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof withProducer }>;
type Rating = { notaMedia: number | null; totalAvaliacoes: number };

export type ProductInput = {
  nome: string;
  descricao: string;
  categoria: string;
  material: string;
  cor?: string | null;
  preco: number;
  imagem: string;
  estoque: number;
  prazoProducao: number;
};

export type ProductFilters = Pagination & {
  busca?: string;
  categoria?: string;
  material?: string;
  precoMin?: number;
  precoMax?: number;
  produtorId?: number;
  ordenar: 'recentes' | 'preco_asc' | 'preco_desc';
};

const toProduto = (p: ProductRow, rating: Rating = { notaMedia: null, totalAvaliacoes: 0 }) => ({
  id: p.id,
  produtorId: p.producerId,
  produtor: p.producer.name,
  nome: p.name,
  descricao: p.description,
  categoria: p.category,
  material: p.material,
  cor: p.color,
  preco: toReais(p.priceCents),
  imagem: p.imageUrl,
  estoque: p.availableQuantity,
  prazoProducao: p.productionDays,
  ativo: p.active,
  ...rating,
});

// Converte os campos da API (português, reais) para as colunas do banco.
function toData(input: Partial<ProductInput>) {
  return {
    name: input.nome,
    description: input.descricao,
    category: input.categoria,
    material: input.material,
    color: input.cor,
    priceCents: input.preco === undefined ? undefined : toCents(input.preco),
    imageUrl: input.imagem,
    availableQuantity: input.estoque,
    productionDays: input.prazoProducao,
  };
}

async function ratingsFor(productIds: number[]) {
  const groups = await prisma.review.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds } },
    _avg: { rating: true },
    _count: true,
  });

  return new Map<number, Rating>(
    groups.map(g => [
      g.productId,
      { notaMedia: g._avg.rating === null ? null : Math.round(g._avg.rating * 10) / 10, totalAvaliacoes: g._count },
    ]),
  );
}

async function listWhere(where: Prisma.ProductWhereInput, orderBy: Prisma.ProductOrderByWithRelationInput, page: Pagination) {
  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, include: withProducer, ...skipTake(page) }),
    prisma.product.count({ where }),
  ]);
  const ratings = await ratingsFor(rows.map(r => r.id));
  return paginated(rows.map(r => toProduto(r, ratings.get(r.id))), total, page);
}

const orderings = {
  recentes: { createdAt: 'desc' },
  preco_asc: { priceCents: 'asc' },
  preco_desc: { priceCents: 'desc' },
} as const;

export function list(filters: ProductFilters) {
  const insensitive = (value: string) => ({ equals: value, mode: 'insensitive' as const });
  const where: Prisma.ProductWhereInput = {
    active: true,
    producerId: filters.produtorId,
    category: filters.categoria ? insensitive(filters.categoria) : undefined,
    material: filters.material ? insensitive(filters.material) : undefined,
    priceCents: {
      gte: filters.precoMin === undefined ? undefined : toCents(filters.precoMin),
      lte: filters.precoMax === undefined ? undefined : toCents(filters.precoMax),
    },
    ...(filters.busca && {
      OR: (['name', 'description', 'material'] as const).map(field => ({
        [field]: { contains: filters.busca, mode: 'insensitive' as const },
      })),
    }),
  };

  return listWhere(where, orderings[filters.ordenar], filters);
}

export function listByProducer(producerId: number, page: Pagination) {
  return listWhere({ producerId }, { createdAt: 'desc' }, page);
}

export async function get(id: number) {
  const product = await prisma.product.findUnique({ where: { id }, include: withProducer });
  if (!product?.active) throw notFound('Produto não encontrado.');

  const ratings = await ratingsFor([id]);
  return toProduto(product, ratings.get(id));
}

export async function create(producerId: number, input: ProductInput) {
  const product = await prisma.product.create({
    data: { ...toData(input), producerId } as Prisma.ProductUncheckedCreateInput,
    include: withProducer,
  });
  return toProduto(product);
}

async function findOwned(id: number, producerId: number) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw notFound('Produto não encontrado.');
  if (product.producerId !== producerId) throw forbidden('Este produto pertence a outro produtor.');
  return product;
}

export async function update(id: number, producerId: number, input: Partial<ProductInput>) {
  await findOwned(id, producerId);
  const product = await prisma.product.update({ where: { id }, data: toData(input), include: withProducer });
  const ratings = await ratingsFor([id]);
  return toProduto(product, ratings.get(id));
}

// Exclusão lógica: o produto pode estar em pedidos antigos.
export async function remove(id: number, producerId: number) {
  await findOwned(id, producerId);
  await prisma.product.update({ where: { id }, data: { active: false } });
}
