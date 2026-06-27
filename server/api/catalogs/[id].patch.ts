// PATCH /api/catalogs/:id — editar/desativar (ARCHITECTURE §5).
import { requireAuth, validateBody, notImplemented } from '../../utils/http'
import { updateCatalogBody } from '../../utils/validators/catalogs'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const _id = getRouterParam(event, 'id')
  await validateBody(event, updateCatalogBody)
  void _id
  return notImplemented('§5')
})
