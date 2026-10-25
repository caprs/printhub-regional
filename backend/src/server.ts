import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.info(`API do PrintHub em http://localhost:${env.PORT}/api`);
});
