// GET /api/fee-profiles?companyId — taxas e juros (ARCHITECTURE §5, §8).
import { requireAuth, validateQuery, notImplemented } from '../utils/http'
import { listFeeProfilesQuery } from '../utils/validators/feeProfiles'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  validateQuery(event, listFeeProfilesQuery)
  return notImplemented('§5')
})
