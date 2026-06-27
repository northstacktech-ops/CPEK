// GET /api/entries?companyId&periodId&page — listar entries (ARCHITECTURE §8).
import { requireAuth, validateQuery, notImplemented } from '../utils/http'
import { listEntriesQuery } from '../utils/validators/entries'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  validateQuery(event, listEntriesQuery)
  // TODO(§8): withTenant(tenantId) → tx.entrie.findMany paginado, filtrado por companyId/periodId.
  return notImplemented('§8')
})
