// GET /api/companies - empresas do tenant.
import { demoCompanies, isDemoAuth } from '../utils/demo'
import { requireAuth } from '../utils/http'
import { withTenant } from '../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  if (isDemoAuth(auth)) return { items: demoCompanies }

  return await withTenant(auth.tenantId, async (tx) => {
    const items = await tx.company.findMany({
      orderBy: { name: 'asc' },
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
    return { items }
  })
})
