// GET /api/exits/export?...&format=csv — export CSV (inclui snapshot + Unidade) (§3, §8).
import { requireAuth, validateQuery, notImplemented } from '../../utils/http'
import { listExitsQuery } from '../../utils/validators/exits'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  validateQuery(event, listExitsQuery)
  // TODO(§8): withTenant → stream CSV via server/utils/csv.ts.
  return notImplemented('§8')
})
