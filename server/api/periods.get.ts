import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listPeriodsQuery } from '../utils/validators/periods'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listPeriodsQuery)

  return await withTenant(auth.tenantId, async (tx) => {
    const items = await tx.period.findMany({
      where: { companyId: query.companyId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })
    return { items }
  })
})
