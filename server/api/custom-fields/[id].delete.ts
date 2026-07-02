import { isDemoAuth } from '../../utils/demo'
import { writeAudit } from '../../utils/audit'
import { apiError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  if (isDemoAuth(auth)) return { ok: true }

  return withTenant(auth.tenantId, async (tx) => {
    await tx.customField.update({ where: { id }, data: { active: false } })
    await writeAudit(tx, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: 'CUSTOM_FIELD_REMOVE',
      entity: 'CustomField',
      entityId: id,
    })
    return { ok: true }
  })
})
