import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { audit } from '../../lib/audit.js';
import { env } from '../../config/env.js';
import { signToken } from '../../middlewares/auth.js';
import type { Role } from '../../generated/prisma/client.js';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

type UserRow = { id: number; name: string; email: string; role: Role };

export const toUsuario = (user: UserRow) => ({
  id: user.id,
  nome: user.name,
  email: user.email,
  perfil: user.role,
});

const session = (user: UserRow) => ({ token: signToken(user), usuario: toUsuario(user) });

export async function register(input: { nome: string; email: string; senha: string; perfil: Role }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, 'EMAIL_EM_USO', 'Já existe uma conta com este e-mail.');

  const user = await prisma.user.create({
    data: {
      name: input.nome,
      email: input.email,
      passwordHash: await bcrypt.hash(input.senha, 10),
      role: input.perfil,
    },
  });

  await audit({ userId: user.id, action: 'USUARIO_CADASTRADO', entity: 'usuario', entityId: user.id, data: { perfil: user.role } });
  return session(user);
}

// Usado quando o e-mail não existe, para a resposta levar o mesmo tempo
// e não revelar quais e-mails estão cadastrados.
const DUMMY_HASH = bcrypt.hashSync('senha-que-nao-existe', 10);

export async function login(input: { email: string; senha: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordOk = await bcrypt.compare(input.senha, user?.passwordHash ?? DUMMY_HASH);
  const valid = user?.active && passwordOk;

  // Mesma mensagem para e-mail inexistente e senha errada.
  if (!user || !valid) throw new AppError(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha incorretos.');

  await audit({ userId: user.id, action: 'LOGIN', entity: 'usuario', entityId: user.id });
  return session(user);
}

export async function me(userId: number) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { pickupPoint: { select: { id: true } } },
  });

  return {
    ...toUsuario(user),
    ...(user.role === 'ATENDENTE' && { pontoRetiradaId: user.pickupPoint?.id ?? null }),
  };
}

export async function forgotPassword(email: string) {
  const response: { mensagem: string; tokenRecuperacao?: string } = {
    mensagem: 'Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.',
  };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.active) return response;

  const token = randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });
  await audit({ userId: user.id, action: 'RECUPERACAO_SOLICITADA', entity: 'usuario', entityId: user.id });

  // Ainda não há envio de e-mail. Fora de produção, o token volta na resposta para teste.
  if (!env.isProduction) {
    console.info(`[recuperação de senha] ${email}: token ${token}`);
    response.tokenRecuperacao = token;
  }
  return response;
}

export async function resetPassword(input: { token: string; novaSenha: string }) {
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(input.token) } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError(400, 'TOKEN_INVALIDO', 'Link de recuperação inválido ou expirado.');
  }

  const passwordHash = await bcrypt.hash(input.novaSenha, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await audit({ userId: record.userId, action: 'SENHA_REDEFINIDA', entity: 'usuario', entityId: record.userId });

  return { mensagem: 'Senha alterada. Faça login com a nova senha.' };
}
