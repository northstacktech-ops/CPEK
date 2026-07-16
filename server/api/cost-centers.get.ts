import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listCostCentersQuery } from '../utils/validators/costCenters'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listCostCentersQuery)

  return withTenant(auth.tenantId, async (tx) => {
    const items = await tx.costCenter.findMany({
      where: { companyId: query.companyId },
      orderBy: { label: 'asc' },
    })
    return { items }
  })
})
