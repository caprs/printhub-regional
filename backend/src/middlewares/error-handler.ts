import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import { Prisma } from '../generated/prisma/client.js';

const send = (res: Response, status: number, codigo: string, mensagem: string, detalhes?: unknown) => {
  res.status(status).json({ erro: { codigo, mensagem, detalhes } });
};

export function notFoundHandler(_req: Request, res: Response) {
  send(res, 404, 'ROTA_NAO_ENCONTRADA', 'Rota não encontrada.');
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) return send(res, err.status, err.code, err.message, err.details);

  // Erros de leitura do corpo (JSON malformado, corpo grande demais).
  if (err && typeof err === 'object' && 'type' in err && 'status' in err && typeof err.status === 'number' && err.status < 500) {
    if (err.type === 'entity.parse.failed') return send(res, 400, 'JSON_INVALIDO', 'O corpo da requisição não é um JSON válido.');
    if (err.type === 'entity.too.large') return send(res, 413, 'CORPO_MUITO_GRANDE', 'Os dados enviados são grandes demais.');
    return send(res, err.status, 'REQUISICAO_INVALIDA', 'Requisição inválida.');
  }

  // Corridas raras que o banco barra: registro duplicado ou já removido.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return send(res, 409, 'REGISTRO_DUPLICADO', 'Este registro já existe.');
    if (err.code === 'P2025') return send(res, 404, 'NAO_ENCONTRADO', 'Registro não encontrado.');
  }

  console.error(err);
  send(res, 500, 'ERRO_INTERNO', 'Erro inesperado. Tente novamente.');
}
