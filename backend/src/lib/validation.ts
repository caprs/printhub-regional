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

// Valor em reais, positivo e com no máximo 2 casas decimais.
export const reais = () =>
  z
    .number()
    .positive()
    .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
      message: 'Use no máximo 2 casas decimais.',
    });

export const idParam = z.object({ id: z.coerce.number().int().positive() });
