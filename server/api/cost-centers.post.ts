import { isDemoAuth } from '../utils/demo'
import { requireAuth, validateBody } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { createCostCenterBody } from '../utils/validators/costCenters'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = await validateBody(event, createCostCenterBody)
  if (isDemoAuth(auth)) return { item: { id: `demo-cost-${Date.now()}`, active: true, ...body } }

  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.costCenter.create({
      data: { tenantId: auth.tenantId, ...body },
    })
    return { item }
  })
})
