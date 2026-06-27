// PATCH /api/exits/:id — editar (409 PERIOD_CLOSED se período fechado) (§8, regra 4).
import { requireAuth, validateBody, notImplemented } from '../../utils/http'
import { updateExitBody } from '../../utils/validators/exits'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const _id = getRouterParam(event, 'id')
  await validateBody(event, updateExitBody)
  // TODO(§8): withTenant → checar period.status; se CLOSED → periodClosedError(); senão update.
  void _id
  return notImplemented('§8')
})
