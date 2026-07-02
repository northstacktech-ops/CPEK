import { demoPeriods, isDemoAuth } from '../utils/demo'
import { requireAuth, validateQuery } from '../utils/http'
import { supabaseAdmin } from '../utils/supabaseAdmin'
import { withTenant } from '../utils/withTenant'
import { listPeriodsQuery } from '../utils/validators/periods'

function normalizePeriod(row: Record<string, unknown>) {
  return {
    id: row.id,
    companyId: row.company_id ?? row.companyId,
    month: row.month,
    year: row.year,
    status: row.status,
    closedAt: row.closed_at ?? row.closedAt,
    closedById: row.closed_by_id ?? row.closedById,
  }
}

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listPeriodsQuery)
  if (isDemoAuth(auth)) return { items: demoPeriods.filter((period) => period.companyId === query.companyId) }

  try {
    return await withTenant(auth.tenantId, async (tx) => {
      const items = await tx.period.findMany({
        where: { companyId: query.companyId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      })
      return { items }
    })
  } catch {
    const { data, error } = await supabaseAdmin()
      .from('period')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .eq('company_id', query.companyId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (error) throw createError({ statusCode: 503, statusMessage: 'Não foi possível carregar os períodos.' })
    return { items: (data ?? []).map(normalizePeriod) }
  }
})
