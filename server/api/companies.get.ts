// GET /api/companies - empresas do tenant.
import { demoCompanies, isDemoAuth } from '../utils/demo'
import { requireAuth } from '../utils/http'
import { completeCompany, hasCompanyProfileColumns } from '../utils/companyProfile'
import { supabaseAdmin } from '../utils/supabaseAdmin'
import { withTenant } from '../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  if (isDemoAuth(auth)) return { items: demoCompanies }

  try {
    return await withTenant(auth.tenantId, async (tx) => {
      const hasProfile = await hasCompanyProfileColumns(tx)
      const items = await tx.company.findMany({
        orderBy: { name: 'asc' },
        select: hasProfile
          ? {
              id: true,
              name: true,
              segment: true,
              active: true,
              updatedAt: true,
              legalName: true,
              taxId: true,
              responsible: true,
              email: true,
              phone: true,
              whatsapp: true,
              zipCode: true,
              address: true,
              number: true,
              complement: true,
              district: true,
              city: true,
              state: true,
              municipalRegistration: true,
              stateRegistration: true,
              businessHours: true,
              notes: true,
            }
          : {
              id: true,
              name: true,
              segment: true,
              active: true,
            },
      })
      return { items: items.map((item) => completeCompany(item)) }
    })
  } catch {
    const { data, error } = await supabaseAdmin()
      .from('company')
      .select('id,name,segment,active')
      .eq('tenant_id', auth.tenantId)
      .order('name', { ascending: true })

    if (error) throw createError({ statusCode: 503, statusMessage: 'Não foi possível carregar as empresas.' })
    return { items: (data ?? []).map((item) => completeCompany(item)) }
  }
})
