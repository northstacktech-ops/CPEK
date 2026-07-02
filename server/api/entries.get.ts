import { demoEntries, isDemoAuth } from '../utils/demo'
import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listEntriesQuery } from '../utils/validators/entries'

const PAGE_SIZE = 50

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listEntriesQuery)
  if (isDemoAuth(auth)) return { items: demoEntries, page: query.page, pageSize: PAGE_SIZE, total: demoEntries.length }

  return withTenant(auth.tenantId, async (tx) => {
    const where = { companyId: query.companyId, ...(query.periodId ? { periodId: query.periodId } : {}) }
    const [items, total] = await Promise.all([
      tx.entry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      tx.entry.count({ where }),
    ])
    return { items, page: query.page, pageSize: PAGE_SIZE, total }
  })
})
