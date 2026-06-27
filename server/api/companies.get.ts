// GET /api/companies — empresas do tenant (ARCHITECTURE §8).
import { withTenant } from '../utils/withTenant'
import { requireAuth } from '../utils/http'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  return withTenant(auth.tenantId, async (tx) => {
    const items = await tx.company.findMany({ orderBy: { name: 'asc' } })
    return { items }
  })
})
