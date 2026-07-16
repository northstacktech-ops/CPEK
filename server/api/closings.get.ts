import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listClosingsQuery } from '../utils/validators/closings'

const PAGE_SIZE = 50

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listClosingsQuery)

  return withTenant(auth.tenantId, async (tx) => {
    const where = { companyId: query.companyId, ...(query.periodId ? { periodId: query.periodId } : {}) }
    const [items, total] = await Promise.all([
      tx.closing.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      tx.closing.count({ where }),
    ])
    return { items, page: query.page, pageSize: PAGE_SIZE, total }
  })
})
