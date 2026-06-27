// GET /api/periods?companyId — períodos da empresa (ARCHITECTURE §8).
import { requireAuth, validateQuery, notImplemented } from '../utils/http'
import { listPeriodsQuery } from '../utils/validators/periods'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  validateQuery(event, listPeriodsQuery)
  return notImplemented('§8')
})
