import { Router } from 'express';
import { z } from 'zod';
import { idParam, parse, reais } from '../../lib/validation.js';
import { paginationQuery } from '../../lib/pagination.js';
import { authenticate, currentUser, requireRole } from '../../middlewares/auth.js';
import * as service from './products.service.js';

const text = (min: number, max: number) => z.string().trim().min(min).max(max);

// RN01: preço, prazo, material e imagem são obrigatórios.
const productBody = z.object({
  nome: text(3, 120),
  descricao: text(1, 2000),
  categoria: text(2, 60),
  material: text(2, 40),
  cor: text(1, 40).nullable().optional(),
  preco: reais(),
  imagem: z.url(),
  estoque: z.number().int().min(0),
  prazoProducao: z.number().int().min(1).max(60),
});

const updateBody = productBody.partial().refine(body => Object.keys(body).length > 0, {
  message: 'Envie ao menos um campo para alterar.',
});

const listQuery = paginationQuery.extend({
  busca: z.string().trim().min(1).optional(),
  categoria: z.string().trim().min(1).optional(),
  material: z.string().trim().min(1).optional(),
  precoMin: z.coerce.number().min(0).optional(),
  precoMax: z.coerce.number().min(0).optional(),
  produtorId: z.coerce.number().int().positive().optional(),
  ordenar: z.enum(['recentes', 'preco_asc', 'preco_desc']).default('recentes'),
});

export const productRoutes = Router();

productRoutes.get('/', async (req, res) => {
  res.json(await service.list(parse(listQuery, req.query)));
});

productRoutes.get('/:id', async (req, res) => {
  res.json(await service.get(parse(idParam, req.params).id));
});

productRoutes.post('/', authenticate, requireRole('PRODUTOR'), async (req, res) => {
  res.status(201).json(await service.create(currentUser(req).id, parse(productBody, req.body)));
});

productRoutes.patch('/:id', authenticate, requireRole('PRODUTOR'), async (req, res) => {
  const { id } = parse(idParam, req.params);
  res.json(await service.update(id, currentUser(req).id, parse(updateBody, req.body)));
});

productRoutes.delete('/:id', authenticate, requireRole('PRODUTOR'), async (req, res) => {
  await service.remove(parse(idParam, req.params).id, currentUser(req).id);
  res.status(204).end();
});

// Montado em /api/producers.
export const producerRoutes = Router();

producerRoutes.get('/me/products', authenticate, requireRole('PRODUTOR'), async (req, res) => {
  res.json(await service.listByProducer(currentUser(req).id, parse(paginationQuery, req.query)));
});
