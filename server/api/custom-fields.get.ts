import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listCustomFieldsQuery } from '../utils/validators/customFields'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listCustomFieldsQuery)

  return withTenant(auth.tenantId, async (tx) => {
    const items = await tx.customField.findMany({
      where: { companyId: query.companyId, ...(query.kind ? { kind: query.kind } : {}) },
      orderBy: { order: 'asc' },
    })
    return { items }
  })
})
