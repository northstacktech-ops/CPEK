import { demoExits, isDemoAuth } from '../utils/demo'
import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listExitsQuery } from '../utils/validators/exits'

const PAGE_SIZE = 50

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listExitsQuery)
  if (isDemoAuth(auth)) return { items: demoExits, page: query.page, pageSize: PAGE_SIZE, total: demoExits.length }

  return withTenant(auth.tenantId, async (tx) => {
    const where = { companyId: query.companyId, ...(query.periodId ? { periodId: query.periodId } : {}) }
    const [items, total] = await Promise.all([
      tx.exit.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      tx.exit.count({ where }),
    ])
    return { items, page: query.page, pageSize: PAGE_SIZE, total }
  })
})
