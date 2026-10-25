import { z } from 'zod';
import { AppError } from './errors.js';

z.config(z.locales.pt());

// Valida e devolve os dados já tipados. Em caso de erro, responde 400 com os campos.
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const details: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.') || 'corpo';
      details[field] ??= issue.message;
    }
    throw new AppError(400, 'VALIDACAO', 'Verifique os campos informados.', details);
  }

  return result.data;
}

// Maior inteiro das colunas do PostgreSQL. Acima disso o banco recusaria com erro 500.
const MAX_INT = 2_147_483_647;

// ID vindo no corpo JSON.
export const id = () => z.number().int().positive().max(MAX_INT);

// ID vindo na URL ou na query string (texto convertido em número).
export const queryId = () => z.coerce.number().int().positive().max(MAX_INT);

export const idParam = z.object({ id: queryId() });

// Valor em reais, positivo, com no máximo 2 casas decimais e um teto razoável.
export const reais = (max: number) =>
  z
    .number()
    .positive()
    .max(max)
    .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
      message: 'Use no máximo 2 casas decimais.',
    });

// Só http e https: bloqueia links como javascript: na imagem do produto.
export const httpUrl = () => z.url({ protocol: /^https?$/ }).max(500);
