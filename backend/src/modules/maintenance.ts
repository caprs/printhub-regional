// Rotinas de prazo: pedidos sem resposta em 48 h e lotes que chegaram aos 7 dias.
// Rodam a cada minuto e também antes das rotas que mostram pedidos e lotes,
// porque hospedagem gratuita "dorme" e o intervalo pode não ter rodado.
import type { NextFunction, Request, Response } from 'express';
import { closeOverdueBatches, expireOverdueOrders } from './orders/orders.service.js';

let running: Promise<void> | null = null;

// Chamadas simultâneas aproveitam a mesma execução.
export function runMaintenance(): Promise<void> {
  running ??= (async () => {
    try {
      await expireOverdueOrders();
      await closeOverdueBatches();
    } finally {
      running = null;
    }
  })();
  return running;
}

export async function maintenanceMiddleware(_req: Request, _res: Response, next: NextFunction) {
  await runMaintenance();
  next();
}

export function startMaintenanceLoop(intervalMs = 60_000) {
  const timer = setInterval(() => {
    runMaintenance().catch(error => console.error('Falha na rotina de prazos:', error));
  }, intervalMs);
  timer.unref();
  return timer;
}
