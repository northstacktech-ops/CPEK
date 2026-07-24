import { writeAudit } from '../../utils/audit'
import { apiError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.entry.findUnique({ where: { id } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Entrada não encontrada')
    await tx.entry.delete({ where: { id } })
    await writeAudit(tx, { tenantId: auth.tenantId, userId: auth.userId, action: 'ENTRY_DELETE', entity: 'Entry', entityId: id })
    return { ok: true }
  })
})
