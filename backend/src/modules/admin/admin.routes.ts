import { Router } from 'express';
import { z } from 'zod';
import { idParam, parse, queryId } from '../../lib/validation.js';
import { paginationQuery } from '../../lib/pagination.js';
import { authenticate, currentUser, requireRole } from '../../middlewares/auth.js';
import { Role } from '../../generated/prisma/enums.js';
import * as service from './admin.service.js';

export const adminCreateUserBody = z.object({
  nome: z.string().trim().min(3).max(100),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  senha: z.string().min(8).max(72),
  perfil: z.enum(Role),
});

export const adminUpdateUserBody = z
  .object({ nome: z.string().trim().min(3).max(100), perfil: z.enum(Role), ativo: z.boolean() })
  .partial()
  .refine(body => Object.keys(body).length > 0, { message: 'Envie ao menos um campo para alterar.' });

const usersQuery = paginationQuery.extend({
  perfil: z.enum(Role).optional(),
  busca: z.string().trim().min(1).optional(),
  ativo: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
});

const logsQuery = paginationQuery.extend({
  acao: z.string().trim().min(1).optional(),
  entidade: z.string().trim().min(1).optional(),
  usuarioId: queryId().optional(),
});

// Montado na raiz de /api.
export const adminRoutes = Router();

adminRoutes.get('/dashboard', authenticate, requireRole('ADMINISTRADOR', 'PRODUTOR'), async (req, res) => {
  res.json(await service.dashboard(currentUser(req)));
});

adminRoutes.use('/admin', authenticate, requireRole('ADMINISTRADOR'));

adminRoutes.get('/admin/users', async (req, res) => {
  res.json(await service.listUsers(parse(usersQuery, req.query)));
});

adminRoutes.post('/admin/users', async (req, res) => {
  res.status(201).json(await service.createUser(currentUser(req), parse(adminCreateUserBody, req.body)));
});

adminRoutes.patch('/admin/users/:id', async (req, res) => {
  const { id } = parse(idParam, req.params);
  res.json(await service.updateUser(currentUser(req), id, parse(adminUpdateUserBody, req.body)));
});

adminRoutes.get('/admin/audit-logs', async (req, res) => {
  res.json(await service.listAuditLogs(parse(logsQuery, req.query)));
});
