import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { AppError, conflict, notFound } from '../../lib/errors.js';
import { audit } from '../../lib/audit.js';
import { paginated, skipTake, type Pagination } from '../../lib/pagination.js';
import type { AuthUser } from '../../middlewares/auth.js';
import type { OrderStatus, Prisma, Role } from '../../generated/prisma/client.js';

// ---------- Dashboard ----------

const IN_PROGRESS: OrderStatus[] = [
  'AGUARDANDO_ACEITACAO',
  'ACEITO',
  'EM_PRODUCAO',
  'PRONTO_PARA_ENTREGA',
  'DISPONIVEL_RETIRADA',
];
// Vendas que contam para "mais vendidos": o produtor aceitou e não houve cancelamento.
const SOLD: OrderStatus[] = ['ACEITO', 'EM_PRODUCAO', 'PRONTO_PARA_ENTREGA', 'DISPONIVEL_RETIRADA', 'RETIRADO'];

// Administrador vê tudo; produtor vê só os próprios números.
export async function dashboard(user: AuthUser) {
  const producerId = user.role === 'PRODUTOR' ? user.id : undefined;
  const orderWhere: Prisma.OrderWhereInput = { producerId };
  const batchWhere: Prisma.BatchWhereInput = producerId ? { orders: { some: { producerId } } } : {};

  const [byStatus, activeProducts, activePoints, batchesByStatus, topItems] = await Promise.all([
    prisma.order.groupBy({ by: ['status'], where: orderWhere, _count: true }),
    prisma.product.count({ where: { active: true, producerId } }),
    prisma.pickupPoint.count({ where: { active: true } }),
    prisma.batch.groupBy({ by: ['status'], where: batchWhere, _count: true }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { ...orderWhere, status: { in: SOLD } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  const porStatus = Object.fromEntries(byStatus.map(g => [g.status, g._count])) as Partial<Record<OrderStatus, number>>;
  const sum = (statuses: OrderStatus[]) => statuses.reduce((total, s) => total + (porStatus[s] ?? 0), 0);

  const names = await prisma.product.findMany({
    where: { id: { in: topItems.map(t => t.productId) } },
    select: { id: true, name: true },
  });
  const batchCount = (status: string) => batchesByStatus.find(b => b.status === status)?._count ?? 0;

  return {
    pedidos: {
      total: byStatus.reduce((total, g) => total + g._count, 0),
      emAndamento: sum(IN_PROGRESS),
      aguardandoAceitacao: porStatus.AGUARDANDO_ACEITACAO ?? 0,
      retirados: porStatus.RETIRADO ?? 0,
      porStatus,
    },
    produtos: { ativos: activeProducts },
    pontosAtivos: activePoints,
    lotes: {
      emFormacao: batchCount('EM_FORMACAO'),
      fechados: batchesByStatus.filter(b => b.status !== 'EM_FORMACAO').reduce((total, b) => total + b._count, 0),
      concluidos: batchCount('CONCLUIDO'),
    },
    maisVendidos: topItems.map(t => ({
      produtoId: t.productId,
      nome: names.find(n => n.id === t.productId)?.name ?? '',
      quantidade: t._sum.quantity ?? 0,
    })),
  };
}

// ---------- Usuários ----------

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  active: true,
  createdAt: true,
  pickupPoint: { select: { id: true } },
} satisfies Prisma.UserSelect;

const toUsuarioAdmin = (u: Prisma.UserGetPayload<{ select: typeof userSelect }>) => ({
  id: u.id,
  nome: u.name,
  email: u.email,
  telefone: u.phone,
  perfil: u.role,
  ativo: u.active,
  criadoEm: u.createdAt,
  pontoRetiradaId: u.pickupPoint?.id ?? null,
});

export type UserFilters = Pagination & { perfil?: Role; busca?: string; ativo?: boolean };

export async function listUsers(filters: UserFilters) {
  const where: Prisma.UserWhereInput = {
    role: filters.perfil,
    active: filters.ativo,
    ...(filters.busca && {
      OR: [
        { name: { contains: filters.busca, mode: 'insensitive' } },
        { email: { contains: filters.busca, mode: 'insensitive' } },
      ],
    }),
  };
  const [rows, total] = await Promise.all([
    prisma.user.findMany({ where, select: userSelect, orderBy: { createdAt: 'desc' }, ...skipTake(filters) }),
    prisma.user.count({ where }),
  ]);
  return paginated(rows.map(toUsuarioAdmin), total, filters);
}

export async function createUser(admin: AuthUser, input: { nome: string; email: string; senha: string; perfil: Role }) {
  if (await prisma.user.findUnique({ where: { email: input.email } })) {
    throw new AppError(409, 'EMAIL_EM_USO', 'Já existe uma conta com este e-mail.');
  }

  const user = await prisma.user.create({
    data: { name: input.nome, email: input.email, role: input.perfil, passwordHash: await bcrypt.hash(input.senha, 10) },
    select: userSelect,
  });
  await audit({ userId: admin.id, action: 'USUARIO_CRIADO_PELO_ADMIN', entity: 'usuario', entityId: user.id, data: { perfil: user.role } });
  return toUsuarioAdmin(user);
}

export async function updateUser(admin: AuthUser, id: number, input: { nome?: string; perfil?: Role; ativo?: boolean }) {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) throw notFound('Usuário não encontrado.');

  // Evita que o sistema fique sem administrador por engano.
  if (id === admin.id && (input.ativo === false || (input.perfil && input.perfil !== 'ADMINISTRADOR'))) {
    throw conflict('ALTERACAO_PROPRIA', 'Você não pode desativar nem trocar o perfil da sua própria conta.');
  }
  if (user.pickupPoint && input.perfil && input.perfil !== 'ATENDENTE') {
    throw conflict('ATENDENTE_VINCULADO', 'Este atendente está vinculado a um ponto. Troque o atendente do ponto antes.');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { name: input.nome, role: input.perfil, active: input.ativo },
    select: userSelect,
  });
  await audit({ userId: admin.id, action: 'USUARIO_ALTERADO', entity: 'usuario', entityId: id, data: { ...input } });
  return toUsuarioAdmin(updated);
}

// ---------- Logs ----------

export type AuditFilters = Pagination & { acao?: string; entidade?: string; usuarioId?: number };

export async function listAuditLogs(filters: AuditFilters) {
  const where: Prisma.AuditLogWhereInput = { action: filters.acao, entity: filters.entidade, userId: filters.usuarioId };
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { id: 'desc' },
      ...skipTake(filters),
    }),
    prisma.auditLog.count({ where }),
  ]);

  return paginated(
    rows.map(log => ({
      id: log.id,
      acao: log.action,
      usuarioId: log.userId,
      usuario: log.user?.name ?? 'Sistema',
      entidade: log.entity,
      entidadeId: log.entityId,
      dados: log.data,
      data: log.createdAt,
    })),
    total,
    filters,
  );
}
