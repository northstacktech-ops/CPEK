import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listFeeProfilesQuery } from '../utils/validators/feeProfiles'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listFeeProfilesQuery)

  return withTenant(auth.tenantId, async (tx) => {
    const items = await tx.feeProfile.findMany({
      where: { companyId: query.companyId },
      orderBy: { label: 'asc' },
    })
    return { items: items.map((item) => ({ ...item, value: Number(item.value) })) }
  })
})
