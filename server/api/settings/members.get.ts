// GET /api/settings/members — membros do tenant (admin) (ARCHITECTURE §8, §9).
import { requireAdmin, notImplemented } from '../../utils/http'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  // TODO(§8): withTenant → tx.user.findMany.
  return notImplemented('§8')
})
