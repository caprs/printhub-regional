import { Router } from 'express';
import { z } from 'zod';
import { idParam, parse, queryId } from '../../lib/validation.js';
import { paginationQuery } from '../../lib/pagination.js';
import { authenticate, currentUser, requireRole } from '../../middlewares/auth.js';
import { BatchStatus } from '../../generated/prisma/enums.js';
import * as service from './batches.service.js';

const listQuery = paginationQuery.extend({
  pontoRetiradaId: queryId().optional(),
  status: z.enum(BatchStatus).optional(),
});

export const batchRoutes = Router();

batchRoutes.use(authenticate);

batchRoutes.get('/', async (req, res) => {
  res.json(await service.list(parse(listQuery, req.query)));
});

batchRoutes.get('/:id', async (req, res) => {
  res.json(await service.get(parse(idParam, req.params).id));
});

batchRoutes.get('/:id/orders', requireRole('ADMINISTRADOR', 'ATENDENTE'), async (req, res) => {
  res.json(await service.listOrders(parse(idParam, req.params).id, currentUser(req)));
});
