// GET /api/catalogs?companyId&kind — forma de pagamento, serviço, status, categoria.
// ARCHITECTURE §5, §8.
import { requireAuth, validateQuery, notImplemented } from '../utils/http'
import { listCatalogsQuery } from '../utils/validators/catalogs'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  validateQuery(event, listCatalogsQuery)
  return notImplemented('§5')
})
