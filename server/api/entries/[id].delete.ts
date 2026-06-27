// DELETE /api/entries/:id — excluir (409 se fechado; AuditLog) (§8, §14).
import { requireAuth, notImplemented } from '../../utils/http'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const _id = getRouterParam(event, 'id')
  // TODO(§14): withTenant → checar período; writeAudit('ENTRY_DELETE'); delete.
  void _id
  return notImplemented('§14')
})
