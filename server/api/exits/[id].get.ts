// GET /api/exits/:id — detalhe (ARCHITECTURE §8). Cross-tenant → 404 (RLS).
import { requireAuth, notImplemented } from '../../utils/http'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const _id = getRouterParam(event, 'id')
  // TODO(§8): withTenant → tx.exit.findUnique; 404 se de outro tenant.
  void _id
  return notImplemented('§8')
})
