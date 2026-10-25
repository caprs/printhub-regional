import { Router } from 'express';
import { z } from 'zod';
import { id, idParam, parse } from '../../lib/validation.js';
import { paginationQuery } from '../../lib/pagination.js';
import { authenticate, currentUser } from '../../middlewares/auth.js';
import * as service from './reviews.service.js';

export const reviewBody = z.object({
  pedidoId: id(),
  produtoId: id(),
  nota: z.number().int().min(1).max(5),
  comentario: z.string().trim().max(1000).optional(),
});

// Montado na raiz de /api.
export const reviewRoutes = Router();

reviewRoutes.post('/reviews', authenticate, async (req, res) => {
  res.status(201).json(await service.create(currentUser(req), parse(reviewBody, req.body)));
});

reviewRoutes.get('/products/:id/reviews', async (req, res) => {
  res.json(await service.listForProduct(parse(idParam, req.params).id, parse(paginationQuery, req.query)));
});

reviewRoutes.get('/producers/:id/reviews', async (req, res) => {
  res.json(await service.listForProducer(parse(idParam, req.params).id, parse(paginationQuery, req.query)));
});
