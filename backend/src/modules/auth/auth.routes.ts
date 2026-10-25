import { Router } from 'express';
import { z } from 'zod';
import { parse } from '../../lib/validation.js';
import { authenticate, currentUser } from '../../middlewares/auth.js';
import * as service from './auth.service.js';

const email = z.string().trim().toLowerCase().pipe(z.email());
const senha = z.string().min(8).max(72);

export const registerBody = z.object({
  nome: z.string().trim().min(3).max(100),
  email,
  senha,
  // ATENDENTE e ADMINISTRADOR são criados pelo administrador.
  perfil: z.enum(['CONSUMIDOR', 'PRODUTOR']),
});

export const loginBody = z.object({ email, senha: z.string().min(1) });
export const forgotBody = z.object({ email });
export const resetBody = z.object({ token: z.string().min(1), novaSenha: senha });

export const authRoutes = Router();

authRoutes.post('/register', async (req, res) => {
  res.status(201).json(await service.register(parse(registerBody, req.body)));
});

authRoutes.post('/login', async (req, res) => {
  res.json(await service.login(parse(loginBody, req.body)));
});

authRoutes.get('/me', authenticate, async (req, res) => {
  res.json(await service.me(currentUser(req).id));
});

authRoutes.post('/forgot-password', async (req, res) => {
  res.json(await service.forgotPassword(parse(forgotBody, req.body).email));
});

authRoutes.post('/reset-password', async (req, res) => {
  res.json(await service.resetPassword(parse(resetBody, req.body)));
});
