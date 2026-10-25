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

// Cria um usuário direto no banco e devolve o token de login.
export async function createUser(role: Role, email = `${role.toLowerCase()}-${Date.now()}@teste.local`) {
  passwordHash ??= await bcrypt.hash(TEST_PASSWORD, 4);
  const user = await prisma.user.create({ data: { name: `Usuário ${role}`, email, role, passwordHash } });
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
