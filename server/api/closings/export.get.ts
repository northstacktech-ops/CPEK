// GET /api/closings/export?...&format=csv — export CSV (inclui snapshot + Unidade) (§3, §8).
import { requireAuth, validateQuery, notImplemented } from '../../utils/http'
import { listClosingsQuery } from '../../utils/validators/closings'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  validateQuery(event, listClosingsQuery)
  // TODO(§8): withTenant → stream CSV via server/utils/csv.ts.
  return notImplemented('§8')
})
