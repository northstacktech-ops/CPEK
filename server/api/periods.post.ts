import { randomUUID } from 'node:crypto'
import { isDemoAuth } from '../utils/demo'
import { requireAuth, validateBody } from '../utils/http'
import { supabaseAdmin } from '../utils/supabaseAdmin'
import { withTenant } from '../utils/withTenant'
import { createPeriodBody } from '../utils/validators/periods'

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
  const body = await validateBody(event, createPeriodBody)
  if (isDemoAuth(auth)) return { item: { id: randomUUID(), status: 'OPEN', ...body } }

  try {
    return await withTenant(auth.tenantId, async (tx) => {
      const item = await tx.period.upsert({
        where: { companyId_year_month: { companyId: body.companyId, year: body.year, month: body.month } },
        update: {},
        create: { tenantId: auth.tenantId, ...body },
      })
      return { item }
    })
  } catch {
    const existing = await supabaseAdmin()
      .from('period')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .eq('company_id', body.companyId)
      .eq('month', body.month)
      .eq('year', body.year)
      .maybeSingle()

    if (existing.error) throw createError({ statusCode: 503, statusMessage: 'Não foi possível criar o período.' })
    if (existing.data) return { item: normalizePeriod(existing.data) }

    const { data, error } = await supabaseAdmin()
      .from('period')
      .insert({
        id: randomUUID(),
        tenant_id: auth.tenantId,
        company_id: body.companyId,
        month: body.month,
        year: body.year,
        status: 'OPEN',
      })
      .select('*')
      .single()

    if (error) throw createError({ statusCode: 503, statusMessage: 'Não foi possível criar o período.' })
    return { item: normalizePeriod(data) }
  }
})
