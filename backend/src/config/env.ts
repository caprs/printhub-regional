import 'dotenv/config';
import { z } from 'zod';

// Falha logo na inicialização se faltar alguma configuração.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default('http://localhost:4200'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuração inválida no .env:', z.treeifyError(parsed.error));
  process.exit(1);
}

// Impede publicar com o segredo de exemplo, que está no repositório.
if (parsed.data.NODE_ENV === 'production' && parsed.data.JWT_SECRET.startsWith('troque-por')) {
  console.error('Defina um JWT_SECRET próprio antes de publicar.');
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  isProduction: parsed.data.NODE_ENV === 'production',
};
