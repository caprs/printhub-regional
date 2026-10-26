import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import type { Role } from '../src/generated/prisma/client.js';

export const api = () => request(app);

export async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE users, products, pickup_points, orders, order_items, batches, reviews,
             order_status_history, audit_logs, password_reset_tokens
    RESTART IDENTITY CASCADE
  `);
}

const TEST_PASSWORD = 'senha-de-teste';
let passwordHash: string | undefined;
let sequence = 0;

export type TestUser = Awaited<ReturnType<typeof createUser>>;

// Cria um usuário direto no banco e devolve o token de login.
export async function createUser(role: Role, email = `${role.toLowerCase()}-${++sequence}@teste.local`) {
  passwordHash ??= await bcrypt.hash(TEST_PASSWORD, 4);
  const user = await prisma.user.create({ data: { name: `Usuário ${role} ${sequence}`, email, role, passwordHash } });
  const res = await api().post('/api/auth/login').send({ email, senha: TEST_PASSWORD });
  return { user, token: res.body.token as string, auth: { Authorization: `Bearer ${res.body.token}` } };
}

export const validProduct = {
  nome: 'Organizador de mesa',
  descricao: 'Organizador impresso em 3D.',
  categoria: 'Organização',
  material: 'PLA',
  cor: 'Azul',
  preco: 29.9,
  imagem: 'https://placehold.co/600x400',
  estoque: 10,
  prazoProducao: 3,
};

export function createProduct(producerId: number, overrides: { priceCents?: number; availableQuantity?: number; name?: string } = {}) {
  return prisma.product.create({
    data: {
      producerId,
      name: overrides.name ?? 'Produto de teste',
      description: 'Descrição',
      category: 'Utilidades',
      material: 'PLA',
      priceCents: overrides.priceCents ?? 1000,
      availableQuantity: overrides.availableQuantity ?? 10,
      productionDays: 2,
      imageUrl: 'https://placehold.co/600x400',
    },
  });
}

export function createPoint(responsibleUserId: number | null, deliveryCostCents = 1800, name = 'Ponto Centro') {
  return prisma.pickupPoint.create({
    data: { name, address: 'Rua A, 1', district: 'Centro', city: 'Ourinhos - SP', deliveryCostCents, responsibleUserId },
  });
}

// Cenário padrão: 2 produtores, 4 consumidores, 1 ponto com atendente, 1 admin.
export async function scenario(deliveryCostCents = 1800) {
  const producerA = await createUser('PRODUTOR');
  const producerB = await createUser('PRODUTOR');
  const consumers = [];
  for (let i = 0; i < 4; i++) consumers.push(await createUser('CONSUMIDOR'));
  const attendant = await createUser('ATENDENTE');
  const admin = await createUser('ADMINISTRADOR');

  const point = await createPoint(attendant.user.id, deliveryCostCents);
  const productA = await createProduct(producerA.user.id, { priceCents: 3500, name: 'Produto A' });
  const productA2 = await createProduct(producerA.user.id, { priceCents: 4800, name: 'Produto A2' });
  const productB = await createProduct(producerB.user.id, { priceCents: 2200, name: 'Produto B' });

  return { producerA, producerB, consumers, attendant, admin, point, productA, productA2, productB };
}

export async function placeOrder(buyer: TestUser, pointId: number, items: { produtoId: number; quantidade: number }[]) {
  const res = await api().post('/api/orders').set(buyer.auth).send({ pontoRetiradaId: pointId, itens: items });
  if (res.status !== 201) throw new Error(`Pedido falhou: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as { id: number } & Record<string, unknown>;
}

export const patch = (path: string, who: TestUser, body?: object) => api().patch(`/api${path}`).set(who.auth).send(body);
