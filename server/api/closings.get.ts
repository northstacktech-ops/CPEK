// GET /api/closings?companyId&periodId&page — listar closings (ARCHITECTURE §8).
import { requireAuth, validateQuery, notImplemented } from '../utils/http'
import { listClosingsQuery } from '../utils/validators/closings'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  validateQuery(event, listClosingsQuery)
  // TODO(§8): withTenant(tenantId) → tx.closing.findMany paginado, filtrado por companyId/periodId.
  return notImplemented('§8')
})
