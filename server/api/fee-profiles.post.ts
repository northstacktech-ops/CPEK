import { requireAuth, validateBody } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { createFeeProfileBody } from '../utils/validators/feeProfiles'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = await validateBody(event, createFeeProfileBody)

  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.feeProfile.create({
      data: { tenantId: auth.tenantId, ...body },
    })
    return { item: { ...item, value: Number(item.value) } }
  })
})
