import { demoCatalogs, isDemoAuth } from '../utils/demo'
import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listCatalogsQuery } from '../utils/validators/catalogs'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listCatalogsQuery)
  if (isDemoAuth(auth)) {
    return { items: demoCatalogs.filter((item) => item.companyId === query.companyId && (!query.kind || item.kind === query.kind)) }
  }

  return withTenant(auth.tenantId, async (tx) => {
    const items = await tx.catalogValue.findMany({
      where: { companyId: query.companyId, ...(query.kind ? { kind: query.kind } : {}) },
      orderBy: [{ kind: 'asc' }, { order: 'asc' }, { label: 'asc' }],
    })
    return { items }
  })
})
