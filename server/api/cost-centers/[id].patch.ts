// PATCH /api/cost-centers/:id — editar/desativar (ARCHITECTURE §5).
import { requireAuth, validateBody, notImplemented } from '../../utils/http'
import { updateCostCenterBody } from '../../utils/validators/costCenters'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const _id = getRouterParam(event, 'id')
  await validateBody(event, updateCostCenterBody)
  void _id
  return notImplemented('§5')
})
