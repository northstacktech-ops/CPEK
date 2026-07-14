import { DEMO_CONTACT_CLIENT_ID, DEMO_CONTACT_SUPPLIER_ID, isDemoAuth } from '../utils/demo'
import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listContactsQuery } from '../utils/validators/contacts'

const demoContacts = [
  { id: DEMO_CONTACT_CLIENT_ID, type: 'CLIENT', name: 'Marcos Andrade', phone: '(11) 98765-4321', email: 'marcos@email.com', taxId: '123.456.789-00', active: true },
  { id: DEMO_CONTACT_SUPPLIER_ID, type: 'SUPPLIER', name: 'Posto Shell', phone: '(11) 2345-6789', email: 'shell@posto.com', taxId: '98.765.432/0001-11', active: true },
]

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
