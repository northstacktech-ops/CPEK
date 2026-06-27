// PATCH /api/fee-profiles/:id — editar/desativar (ARCHITECTURE §5).
import { requireAuth, validateBody, notImplemented } from '../../utils/http'
import { updateFeeProfileBody } from '../../utils/validators/feeProfiles'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const _id = getRouterParam(event, 'id')
  await validateBody(event, updateFeeProfileBody)
  void _id
  return notImplemented('§5')
})
