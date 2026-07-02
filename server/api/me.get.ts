// GET /api/me — sessão, papel, empresas acessíveis (ARCHITECTURE §8, §9).
import { withTenant } from '../utils/withTenant'
import { requireAuth } from '../utils/http'
import { supabaseAdmin } from '../utils/supabaseAdmin'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  try {
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
  } catch {
    const { data, error } = await supabaseAdmin()
      .from('company')
      .select('id,name,segment')
      .eq('tenant_id', auth.tenantId)
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) throw createError({ statusCode: 503, statusMessage: 'Não foi possível carregar as empresas.' })

    return {
      user: { id: auth.userId, email: auth.email, role: auth.role },
      tenantId: auth.tenantId,
      companies: data ?? [],
    }
  }
})
