import { writeAudit } from '../../utils/audit'
import { apiError, requireAuth, validateBody } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { updateCustomFieldBody } from '../../utils/validators/customFields'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  const body = await validateBody(event, updateCustomFieldBody)

  const { confirm, ...data } = body
  void confirm
  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.customField.findUnique({ where: { id } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Campo customizado não encontrado')
    const item = await tx.customField.update({ where: { id }, data })
    await writeAudit(tx, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: 'CUSTOM_FIELD_EDIT',
      entity: 'CustomField',
      entityId: id,
    })
    return { item }
  })
})
