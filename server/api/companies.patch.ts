// PATCH /api/companies - atualiza os dados principais da empresa ativa.
import { demoCompanies, isDemoAuth } from '../utils/demo'
import { apiError, requireAdmin, validateBody } from '../utils/http'
import { completeCompany, hasCompanyProfileColumns } from '../utils/companyProfile'
import { supabaseAdmin } from '../utils/supabaseAdmin'
import { updateCompanyBody } from '../utils/validators/companies'
import { withTenant } from '../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAdmin(event)
  const body = await validateBody(event, updateCompanyBody)

  if (isDemoAuth(auth)) {
    const current = demoCompanies.find((item) => item.id === body.id)
    if (!current) throw apiError(404, 'COMPANY_NOT_FOUND', 'Empresa não encontrada')

    return {
      item: {
        ...current,
        ...body,
        updatedAt: new Date().toISOString(),
      },
    }
  }

  try {
    return await withTenant(auth.tenantId, async (tx) => {
      const hasProfile = await hasCompanyProfileColumns(tx)
      const item = await tx.company.update({
        where: { id: body.id },
        data: hasProfile
          ? {
              name: body.name,
              segment: body.segment || null,
              active: body.active,
              legalName: body.legalName || null,
              taxId: body.taxId || null,
              responsible: body.responsible || null,
              email: body.email || null,
              phone: body.phone || null,
              whatsapp: body.whatsapp || null,
              zipCode: body.zipCode || null,
              address: body.address || null,
              number: body.number || null,
              complement: body.complement || null,
              district: body.district || null,
              city: body.city || null,
              state: body.state || null,
              municipalRegistration: body.municipalRegistration || null,
              stateRegistration: body.stateRegistration || null,
              businessHours: body.businessHours || null,
              notes: body.notes || null,
            }
          : {
              name: body.name,
              segment: body.segment || null,
              active: body.active,
            },
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

      return { item: completeCompany(item) }
    })
  } catch {
    const { data, error } = await supabaseAdmin()
      .from('company')
      .update({
        name: body.name,
        segment: body.segment || null,
        active: body.active,
      })
      .eq('id', body.id)
      .eq('tenant_id', auth.tenantId)
      .select('id,name,segment,active')
      .single()

    if (error) throw createError({ statusCode: 503, statusMessage: 'Não foi possível salvar os dados da empresa.' })
    return { item: completeCompany(data) }
  }
})
