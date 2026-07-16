import { writeAudit } from '../../utils/audit'
import { apiError, periodClosedError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.exit.findUnique({ where: { id }, include: { period: true } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Saída não encontrada')
    if (current.period.status === 'CLOSED') throw periodClosedError()
    await tx.exit.delete({ where: { id } })
    await writeAudit(tx, { tenantId: auth.tenantId, userId: auth.userId, action: 'EXIT_DELETE', entity: 'Exit', entityId: id })
    return { ok: true }
  })
})
