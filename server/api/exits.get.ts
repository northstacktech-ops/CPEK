// GET /api/exits?companyId&periodId&page — listar exits (ARCHITECTURE §8).
import { requireAuth, validateQuery, notImplemented } from '../utils/http'
import { listExitsQuery } from '../utils/validators/exits'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  validateQuery(event, listExitsQuery)
  // TODO(§8): withTenant(tenantId) → tx.exit.findMany paginado, filtrado por companyId/periodId.
  return notImplemented('§8')
})
