import { app } from './app.js';
import { env } from './config/env.js';
import { runMaintenance, startMaintenanceLoop } from './modules/maintenance.js';

app.listen(env.PORT, () => {
  console.info(`API do PrintHub em http://localhost:${env.PORT}/api`);
  console.info(`Documentação em http://localhost:${env.PORT}/api/docs`);
});

// Aplica os prazos pendentes ao subir e depois a cada minuto.
runMaintenance().catch(error => console.error('Falha na rotina de prazos:', error));
startMaintenanceLoop();
