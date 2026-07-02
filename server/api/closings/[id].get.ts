import { demoClosings, isDemoAuth } from '../../utils/demo'
import { apiError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  if (isDemoAuth(auth)) return { item: demoClosings.find((item) => item.id === id) ?? null }

  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.closing.findUnique({ where: { id } })
    if (!item) throw apiError(404, 'NOT_FOUND', 'Fechamento não encontrado')
    return { item }
  })
})
