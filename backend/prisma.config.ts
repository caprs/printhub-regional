import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Vazio não impede o `prisma generate` do npm install, que roda antes de existir o .env.
    // Migrations e seed exigem a variável e avisam se ela faltar.
    url: process.env.DATABASE_URL ?? '',
  },
});
