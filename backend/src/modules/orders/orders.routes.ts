import { Router } from 'express';
import { z } from 'zod';
import { id, idParam, parse } from '../../lib/validation.js';
import { paginationQuery } from '../../lib/pagination.js';
import { authenticate, currentUser, requireRole } from '../../middlewares/auth.js';
import { OrderStatus } from '../../generated/prisma/enums.js';
import * as service from './orders.service.js';

export const orderBody = z.object({
  pontoRetiradaId: id(),
  itens: z
    .array(z.object({ produtoId: id(), quantidade: z.number().int().min(1).max(100) }))
    .min(1)
    .max(20),
});

export const rejectBody = z.object({ motivo: z.string().trim().max(500).optional() }).default({});
export const statusBody = z.object({ status: z.enum(['EM_PRODUCAO', 'PRONTO_PARA_ENTREGA']) });

const listQuery = paginationQuery.extend({ status: z.enum(OrderStatus).optional() });

// Montado na raiz de /api: as rotas têm prefixos diferentes (/orders, /producer, /attendant).
export const orderRoutes = Router();

orderRoutes.use(['/orders', '/producer', '/attendant'], authenticate);

orderRoutes.post('/orders', requireRole('CONSUMIDOR', 'PRODUTOR'), async (req, res) => {
  res.status(201).json(await service.create(currentUser(req), parse(orderBody, req.body)));
});

orderRoutes.get('/orders/my', async (req, res) => {
  res.json(await service.listMine(currentUser(req), parse(listQuery, req.query)));
});

orderRoutes.get('/producer/orders', requireRole('PRODUTOR'), async (req, res) => {
  res.json(await service.listForProducer(currentUser(req), parse(listQuery, req.query)));
});

orderRoutes.get('/attendant/orders', requireRole('ATENDENTE'), async (req, res) => {
  res.json(await service.listForAttendant(currentUser(req), parse(listQuery, req.query)));
});

orderRoutes.get('/orders/:id', async (req, res) => {
  res.json(await service.getForUser(parse(idParam, req.params).id, currentUser(req)));
});

orderRoutes.patch('/orders/:id/accept', requireRole('PRODUTOR'), async (req, res) => {
  res.json(await service.accept(parse(idParam, req.params).id, currentUser(req)));
});

orderRoutes.patch('/orders/:id/reject', requireRole('PRODUTOR'), async (req, res) => {
  const { motivo } = parse(rejectBody, req.body ?? {});
  res.json(await service.reject(parse(idParam, req.params).id, currentUser(req), motivo));
});

orderRoutes.patch('/orders/:id/status', requireRole('PRODUTOR'), async (req, res) => {
  const { status } = parse(statusBody, req.body);
  res.json(await service.updateStatus(parse(idParam, req.params).id, currentUser(req), status));
});

orderRoutes.patch('/orders/:id/cancel', requireRole('CONSUMIDOR', 'PRODUTOR'), async (req, res) => {
  res.json(await service.cancel(parse(idParam, req.params).id, currentUser(req)));
});

orderRoutes.patch('/orders/:id/received', requireRole('ATENDENTE'), async (req, res) => {
  res.json(await service.receive(parse(idParam, req.params).id, currentUser(req)));
});

orderRoutes.patch('/orders/:id/picked-up', requireRole('ATENDENTE'), async (req, res) => {
  res.json(await service.pickUp(parse(idParam, req.params).id, currentUser(req)));
});
