import { isDemoAuth } from '../utils/demo'
import { requireAuth, validateBody } from '../utils/http'
import { writeAudit } from '../utils/audit'
import { withTenant } from '../utils/withTenant'
import { createCustomFieldBody } from '../utils/validators/customFields'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = await validateBody(event, createCustomFieldBody)
  if (isDemoAuth(auth)) return { item: { id: `demo-field-${Date.now()}`, active: true, ...body } }

  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.customField.create({
      data: { tenantId: auth.tenantId, ...body },
    })
    await writeAudit(tx, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: 'CUSTOM_FIELD_ADD',
      entity: 'CustomField',
      entityId: item.id,
    })
    return { item }
  })
})
