import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError, forbidden } from '../lib/errors.js';
import type { Role } from '../generated/prisma/client.js';

export type AuthUser = { id: number; name: string; email: string; role: Role };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const unauthorized = () => new AppError(401, 'NAO_AUTENTICADO', 'Faça login para continuar.');

export function signToken(user: { id: number; role: Role }) {
  return jwt.sign({ perfil: user.role }, env.JWT_SECRET, { subject: String(user.id), expiresIn: '7d' });
}

// Exige token válido e usuário ativo. O perfil é lido do banco, não do token.
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw unauthorized();

  let userId: number;
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as jwt.JwtPayload;
    userId = Number(payload.sub);
  } catch {
    throw unauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  if (!user?.active) throw unauthorized();

  req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  next();
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) throw forbidden();
    next();
  };

// Para rotas que usam authenticate antes: garante o usuário tipado.
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw unauthorized();
  return req.user;
}
