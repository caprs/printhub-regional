import { prisma, type Tx } from './prisma.js';

type AuditEntry = {
  userId: number | null;
  action: string;
  entity: string;
  entityId?: number;
  data?: Record<string, unknown>;
};

// Registra uma operação crítica. Dentro de transação, passe o tx para gravar junto.
export async function audit(entry: AuditEntry, db: Tx | typeof prisma = prisma) {
  await db.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      data: entry.data as object | undefined,
    },
  });
}
