import { apiError, requireAuth, validateBody } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { createPeriodBody } from '../utils/validators/periods'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = await validateBody(event, createPeriodBody)

  return await withTenant(auth.tenantId, async (tx) => {
    const company = await tx.company.findUnique({ where: { id: body.companyId } })
    if (!company) throw apiError(404, 'NOT_FOUND', 'Empresa não encontrada')
    const item = await tx.period.upsert({
      where: { companyId_year_month: { companyId: body.companyId, year: body.year, month: body.month } },
      update: {},
      create: { tenantId: auth.tenantId, ...body },
    })
    return { item }
  })
})
