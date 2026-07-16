import { requireAuth, validateBody } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { createCostCenterBody } from '../utils/validators/costCenters'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = await validateBody(event, createCostCenterBody)

  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.costCenter.create({
      data: { tenantId: auth.tenantId, ...body },
    })
    return { item }
  })
})
