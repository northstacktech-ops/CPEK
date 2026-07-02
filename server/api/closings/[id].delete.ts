import { isDemoAuth } from '../../utils/demo'
import { writeAudit } from '../../utils/audit'
import { apiError, periodClosedError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  if (isDemoAuth(auth)) return { ok: true }

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.closing.findUnique({ where: { id }, include: { period: true } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Fechamento não encontrado')
    if (current.period.status === 'CLOSED') throw periodClosedError()
    await tx.closing.delete({ where: { id } })
    await writeAudit(tx, { tenantId: auth.tenantId, userId: auth.userId, action: 'CLOSING_DELETE', entity: 'Closing', entityId: id })
    return { ok: true }
  })
})
