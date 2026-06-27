// POST /api/periods/:id/close — fechar período (admin) → trava edição + audit (§8, §14).
import { requireAdmin, validateBody, notImplemented } from '../../../utils/http'
import { closePeriodBody } from '../../../utils/validators/periods'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const _id = getRouterParam(event, 'id')
  await validateBody(event, closePeriodBody) // confirm: true
  // TODO(§14): withTenant → status=CLOSED, closedAt/closedById; writeAudit('PERIOD_CLOSE').
  void _id
  return notImplemented('§14')
})
