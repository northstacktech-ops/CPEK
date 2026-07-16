import { writeAudit } from '../../../utils/audit'
import { apiError, requireAdmin, validateBody } from '../../../utils/http'
import { withTenant } from '../../../utils/withTenant'
import { closePeriodBody } from '../../../utils/validators/periods'

export default defineEventHandler(async (event) => {
  const auth = requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  await validateBody(event, closePeriodBody)

  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.period.update({
      where: { id },
      data: { status: 'OPEN', closedAt: null, closedById: null },
    })
    await writeAudit(tx, { tenantId: auth.tenantId, userId: auth.userId, action: 'PERIOD_REOPEN', entity: 'Period', entityId: id })
    return { item }
  })
})
