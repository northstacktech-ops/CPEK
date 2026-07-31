import { writeAudit } from '../../utils/audit'
import { apiError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.contact.findUnique({ where: { id } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Contato não encontrado')

    const usageCounts = await Promise.all([
      tx.entry.count({ where: { contactId: id } }),
      tx.exit.count({ where: { contactId: id } }),
      tx.closing.count({ where: { contactId: id } }),
    ])
    if (usageCounts.some((count) => count > 0)) {
      throw apiError(409, 'CONTACT_IN_USE', 'Este contato já foi usado em lançamentos. Use "Bloquear" em vez de apagar.')
    }

    await tx.contact.delete({ where: { id } })
    await writeAudit(tx, { tenantId: auth.tenantId, userId: auth.userId, action: 'CONTACT_DELETE', entity: 'Contact', entityId: id })
    return { ok: true }
  })
})
