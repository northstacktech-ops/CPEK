import { DEMO_FEE_DEFAULT_ID, isDemoAuth } from '../utils/demo'
import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listFeeProfilesQuery } from '../utils/validators/feeProfiles'

const demoFeeProfiles = [
  { id: DEMO_FEE_DEFAULT_ID, label: 'Padrao Boleto', feeType: 'PERCENTAGE', value: 2, active: true },
]

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listFeeProfilesQuery)
  if (isDemoAuth(auth)) return { items: demoFeeProfiles }

  return withTenant(auth.tenantId, async (tx) => {
    const items = await tx.feeProfile.findMany({
      where: { companyId: query.companyId },
      orderBy: { label: 'asc' },
    })
    return { items: items.map((item) => ({ ...item, value: Number(item.value) })) }
  })
})
