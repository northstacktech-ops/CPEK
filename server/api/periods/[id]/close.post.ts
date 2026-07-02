import { isDemoAuth } from '../../../utils/demo'
import { writeAudit } from '../../../utils/audit'
import { apiError, requireAdmin, validateBody } from '../../../utils/http'
import { withTenant } from '../../../utils/withTenant'
import { closePeriodBody } from '../../../utils/validators/periods'

export default defineEventHandler(async (event) => {
  const auth = requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  await validateBody(event, closePeriodBody)
  if (isDemoAuth(auth)) return { item: { id, status: 'CLOSED' } }

  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.period.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), closedById: auth.userId },
    })
    await writeAudit(tx, { tenantId: auth.tenantId, userId: auth.userId, action: 'PERIOD_CLOSE', entity: 'Period', entityId: id })
    return { item }
  })
})
