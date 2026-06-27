// CPEK — AuditLog helper (ARCHITECTURE §14). Registra ações sensíveis:
// fechar/reabrir período, excluir lançamento, alterar campo custom, gerenciar membro.
import type { Prisma } from '@prisma/client'

export async function writeAudit(
  tx: Prisma.TransactionClient,
  params: { tenantId: string; userId?: string; action: string; entity: string; entityId?: string; meta?: Prisma.InputJsonValue },
): Promise<void> {
  await tx.auditLog.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      meta: params.meta,
    },
  })
}
