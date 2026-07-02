import { isDemoAuth } from '../../utils/demo'
import { apiError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  if (isDemoAuth(auth)) return { ok: true }

  return withTenant(auth.tenantId, async (tx) => {
    await tx.catalogValue.update({ where: { id }, data: { active: false } })
    return { ok: true }
  })
})
