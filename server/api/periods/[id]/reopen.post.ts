// POST /api/periods/:id/reopen — reabrir período (admin, com audit) (§8, §14, D §19).
import { requireAdmin, validateBody, notImplemented } from '../../../utils/http'
import { closePeriodBody } from '../../../utils/validators/periods'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const _id = getRouterParam(event, 'id')
  await validateBody(event, closePeriodBody) // confirm: true
  // TODO(§14): withTenant → status=OPEN; writeAudit('PERIOD_REOPEN').
  void _id
  return notImplemented('§14')
})
