import { demoCatalogs, isDemoAuth } from '../../utils/demo'
import { apiError, requireAuth, validateBody } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { updateCatalogBody } from '../../utils/validators/catalogs'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  const body = await validateBody(event, updateCatalogBody)
  if (isDemoAuth(auth)) {
    const item = demoCatalogs.find((c) => c.id === id)
    if (!item) throw apiError(404, 'NOT_FOUND', 'Item não encontrado')
    Object.assign(item, body)
    return { item }
  }

  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.catalogValue.update({ where: { id }, data: body })
    return { item }
  })
})
