import { isDemoAuth } from '../utils/demo'
import { requireAuth, validateBody } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { createContactBody } from '../utils/validators/contacts'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = await validateBody(event, createContactBody)
  if (isDemoAuth(auth)) return { item: { id: `demo-contact-${Date.now()}`, active: true, ...body } }

  return await withTenant(auth.tenantId, async (tx) => {
    const item = await tx.contact.create({
      data: { tenantId: auth.tenantId, ...body },
    })
    return { item }
  })
})
