import { Router } from 'express';
import { z } from 'zod';
import { id, idParam, parse, reais } from '../../lib/validation.js';
import { authenticate, currentUser, optionalAuthenticate, requireRole } from '../../middlewares/auth.js';
import * as service from './pickup-points.service.js';

const text = (min: number, max: number) => z.string().trim().min(min).max(max);

export const pointBody = z.object({
  nome: text(3, 80),
  endereco: text(3, 200),
  bairro: text(2, 80),
  cidade: text(2, 80),
  custoEntrega: reais(1000),
  atendenteId: id().nullable().optional(),
});

export const pointUpdateBody = pointBody
  .extend({ ativo: z.boolean() })
  .partial()
  .refine(body => Object.keys(body).length > 0, { message: 'Envie ao menos um campo para alterar.' });

const listQuery = z.object({ todos: z.enum(['true', 'false']).optional() });

export const pickupPointRoutes = Router();

pickupPointRoutes.get('/', optionalAuthenticate, async (req, res) => {
  const { todos } = parse(listQuery, req.query);
  res.json(await service.list(todos === 'true' && req.user?.role === 'ADMINISTRADOR'));
});

pickupPointRoutes.get('/:id', optionalAuthenticate, async (req, res) => {
  res.json(await service.get(parse(idParam, req.params).id, req.user?.role === 'ADMINISTRADOR'));
});

pickupPointRoutes.post('/', authenticate, requireRole('ADMINISTRADOR'), async (req, res) => {
  res.status(201).json(await service.create(currentUser(req).id, parse(pointBody, req.body)));
});

pickupPointRoutes.patch('/:id', authenticate, requireRole('ADMINISTRADOR'), async (req, res) => {
  const { id } = parse(idParam, req.params);
  res.json(await service.update(currentUser(req).id, id, parse(pointUpdateBody, req.body)));
});

pickupPointRoutes.delete('/:id', authenticate, requireRole('ADMINISTRADOR'), async (req, res) => {
  await service.deactivate(currentUser(req).id, parse(idParam, req.params).id);
  res.status(204).end();
});
