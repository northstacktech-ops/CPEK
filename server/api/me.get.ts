// GET /api/me — sessão, papel, empresas acessíveis (ARCHITECTURE §8, §9).
import { withTenant } from '../utils/withTenant'
import { requireAuth } from '../utils/http'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  return await withTenant(auth.tenantId, async (tx) => {
    const companies = await tx.company.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, segment: true },
    })
    return {
      user: { id: auth.userId, email: auth.email, role: auth.role },
      tenantId: auth.tenantId,
      companies,
    }
  })
})
