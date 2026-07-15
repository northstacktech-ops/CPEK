import { demoEntries, isDemoAuth } from '../../utils/demo'
import { writeAudit } from '../../utils/audit'
import { apiError, periodClosedError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  if (isDemoAuth(auth)) {
    const idx = demoEntries.findIndex((e) => e.id === id)
    if (idx !== -1) demoEntries.splice(idx, 1)
    return { ok: true }
  }

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.entry.findUnique({ where: { id }, include: { period: true } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Entrada não encontrada')
    if (current.period.status === 'CLOSED') throw periodClosedError()
    await tx.entry.delete({ where: { id } })
    await writeAudit(tx, { tenantId: auth.tenantId, userId: auth.userId, action: 'ENTRY_DELETE', entity: 'Entry', entityId: id })
    return { ok: true }
  })
})
