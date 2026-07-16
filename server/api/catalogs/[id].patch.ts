import { apiError, requireAuth, validateBody } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { updateCatalogBody } from '../../utils/validators/catalogs'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  const body = await validateBody(event, updateCatalogBody)

  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.catalogValue.update({ where: { id }, data: body })
    return { item }
  })
})
