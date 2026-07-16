import { apiError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.catalogValue.findUnique({ where: { id } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Cadastro não encontrado')
    await tx.catalogValue.update({ where: { id }, data: { active: false } })
    return { ok: true }
  })
})
