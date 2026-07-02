import { isDemoAuth } from '../../utils/demo'
import { requireAdmin } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAdmin(event)
  if (isDemoAuth(auth)) {
    return {
      items: [
        { id: '00000000-0000-0000-0000-000000000101', email: 'demo@cpek.local', name: 'Usuario Demo', role: 'ADMIN', active: true },
      ],
    }
  }

  return withTenant(auth.tenantId, async (tx) => {
    const items = await tx.user.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { email: 'asc' },
    })
    return { items }
  })
})
