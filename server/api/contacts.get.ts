import { demoContacts, isDemoAuth } from '../utils/demo'
import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listContactsQuery } from '../utils/validators/contacts'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listContactsQuery)
  if (isDemoAuth(auth)) return { items: demoContacts.filter((item) => !query.type || item.type === query.type) }

  return await withTenant(auth.tenantId, async (tx) => {
    const items = await tx.contact.findMany({
      where: {
        ...(query.companyId ? { companyId: query.companyId } : {}),
        ...(query.type ? { type: query.type } : {}),
      },
      orderBy: { name: 'asc' },
    })
    return { items }
  })
})
