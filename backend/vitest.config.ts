import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

// Os testes usam o banco printhub_test, nunca o de desenvolvimento.
const testEnv = config({ path: '.env.test', quiet: true }).parsed ?? {};

export default defineConfig({
  test: {
    env: testEnv,
    globalSetup: './tests/global-setup.ts',
    // Todos os arquivos compartilham o mesmo banco: rodar um por vez.
    fileParallelism: false,
  },
});
