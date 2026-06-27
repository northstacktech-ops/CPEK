// POST /api/fee-profiles — criar perfil de taxa/juros (Decimal(14,4)) (ARCHITECTURE §5).
import { requireAuth, validateBody, notImplemented } from '../utils/http'
import { createFeeProfileBody } from '../utils/validators/feeProfiles'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  await validateBody(event, createFeeProfileBody)
  return notImplemented('§5')
})
