import { apiError, requireAuth, validateBody } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { updateContactBody } from '../../utils/validators/contacts'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  const body = await validateBody(event, updateContactBody)

  return await withTenant(auth.tenantId, async (tx) => {
    const item = await tx.contact.update({ where: { id }, data: body })
    return { item }
  })
})
