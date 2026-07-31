import { writeAudit } from '../../utils/audit'
import { apiError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.costCenter.findUnique({ where: { id } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Centro de custo não encontrado')

    const usageCount = await tx.exit.count({ where: { costCenterId: id } })
    if (usageCount > 0) {
      throw apiError(409, 'COST_CENTER_IN_USE', 'Este centro de custo já foi usado em lançamentos. Use "Bloquear" em vez de apagar.')
    }

    await tx.costCenter.delete({ where: { id } })
    await writeAudit(tx, { tenantId: auth.tenantId, userId: auth.userId, action: 'COST_CENTER_DELETE', entity: 'CostCenter', entityId: id })
    return { ok: true }
  })
})
