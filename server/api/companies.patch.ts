// PATCH /api/companies - atualiza os dados principais da empresa ativa.
import { requireAdmin, validateBody } from '../utils/http'
import { updateCompanyBody } from '../utils/validators/companies'
import { withTenant } from '../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAdmin(event)
  const body = await validateBody(event, updateCompanyBody)

  return await withTenant(auth.tenantId, async (tx) => {
    const item = await tx.company.update({
      where: { id: body.id },
      data: {
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
        // ?? null (não || null): 0% é valor válido e não pode virar null.
        royaltiesPercent: body.royaltiesPercent ?? null,
        impostoNfPercent: body.impostoNfPercent ?? null,
      },
      select: {
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
        royaltiesPercent: true,
        impostoNfPercent: true,
      },
    })

    return { item }
  })
})
