// POST /api/catalogs — criar valor de catálogo (CATEGORY carrega dreGroup) §5, §7.
import { requireAuth, validateBody, notImplemented } from '../utils/http'
import { createCatalogBody } from '../utils/validators/catalogs'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  await validateBody(event, createCatalogBody)
  return notImplemented('§5')
})
