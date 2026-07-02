import { isDemoAuth } from '../utils/demo'
import { requireAuth, validateBody } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { createCatalogBody } from '../utils/validators/catalogs'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = await validateBody(event, createCatalogBody)
  if (isDemoAuth(auth)) return { item: { id: `demo-catalog-${Date.now()}`, active: true, ...body } }

  return withTenant(auth.tenantId, async (tx) => {
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
