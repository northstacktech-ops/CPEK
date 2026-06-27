// POST /api/cost-centers — criar centro de custo (Fixo/Variável) (ARCHITECTURE §5).
import { requireAuth, validateBody, notImplemented } from '../utils/http'
import { createCostCenterBody } from '../utils/validators/costCenters'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  await validateBody(event, createCostCenterBody)
  return notImplemented('§5')
})
