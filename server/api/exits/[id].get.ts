import { apiError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')

  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.exit.findUnique({ where: { id } })
    if (!item) throw apiError(404, 'NOT_FOUND', 'Saída não encontrada')
    return { item }
  })
})
