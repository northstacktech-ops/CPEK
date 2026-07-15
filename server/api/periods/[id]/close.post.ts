import { demoPeriods, isDemoAuth } from '../../../utils/demo'
import { writeAudit } from '../../../utils/audit'
import { apiError, requireAdmin, validateBody } from '../../../utils/http'
import { withTenant } from '../../../utils/withTenant'
import { closePeriodBody } from '../../../utils/validators/periods'

export default defineEventHandler(async (event) => {
  const auth = requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  await validateBody(event, closePeriodBody)
  if (isDemoAuth(auth)) {
    // Retornar só { id, status } deixa month/year de fora — o front monta
    // "Invalid Date" ao formatar a competência sem esses campos.
    const period = demoPeriods.find((p) => p.id === id)
    if (!period) throw apiError(404, 'NOT_FOUND', 'Período não encontrado')
    period.status = 'CLOSED'
    return { item: period }
  }

  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.period.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), closedById: auth.userId },
    })
    await writeAudit(tx, { tenantId: auth.tenantId, userId: auth.userId, action: 'PERIOD_CLOSE', entity: 'Period', entityId: id })
    return { item }
  })
})
