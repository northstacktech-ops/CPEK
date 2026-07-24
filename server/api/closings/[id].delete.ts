import { writeAudit } from '../../utils/audit'
import { apiError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.closing.findUnique({ where: { id } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Fechamento não encontrado')
    await tx.closing.delete({ where: { id } })
    await writeAudit(tx, { tenantId: auth.tenantId, userId: auth.userId, action: 'CLOSING_DELETE', entity: 'Closing', entityId: id })
    return { ok: true }
  })
})
