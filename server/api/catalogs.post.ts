import { apiError, requireAuth, validateBody } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { createCatalogBody } from '../utils/validators/catalogs'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = await validateBody(event, createCatalogBody)

  return withTenant(auth.tenantId, async (tx) => {
    const company = await tx.company.findUnique({ where: { id: body.companyId } })
    if (!company) throw apiError(404, 'NOT_FOUND', 'Empresa não encontrada')
    const item = await tx.catalogValue.create({
      data: {
        tenantId: auth.tenantId,
        companyId: body.companyId,
        kind: body.kind,
        label: body.label,
        order: body.order,
        dreGroup: body.dreGroup,
      },
    })
    return { item }
  })
})
