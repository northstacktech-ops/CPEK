// GET /api/cost-centers?companyId — centros de custo (ARCHITECTURE §5, §8).
import { requireAuth, validateQuery, notImplemented } from '../utils/http'
import { listCostCentersQuery } from '../utils/validators/costCenters'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  validateQuery(event, listCostCentersQuery)
  return notImplemented('§5')
})
