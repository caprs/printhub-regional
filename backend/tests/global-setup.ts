import { execSync } from 'node:child_process';
import { config } from 'dotenv';

// Aplica as migrations no banco de teste antes de rodar os testes.
export default function setup() {
  const testEnv = config({ path: '.env.test', quiet: true }).parsed ?? {};
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: { ...process.env, ...testEnv } });
}
