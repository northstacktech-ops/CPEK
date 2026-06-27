// GET /api/entries/export?...&format=csv — export CSV (inclui snapshot + Unidade) (§3, §8).
import { requireAuth, validateQuery, notImplemented } from '../../utils/http'
import { listEntriesQuery } from '../../utils/validators/entries'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  validateQuery(event, listEntriesQuery)
  // TODO(§8): withTenant → stream CSV via server/utils/csv.ts.
  return notImplemented('§8')
})
