import { apiError, requireAuth, validateBody } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { updateFeeProfileBody } from '../../utils/validators/feeProfiles'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  const body = await validateBody(event, updateFeeProfileBody)

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.feeProfile.findUnique({ where: { id } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Perfil de taxa não encontrado')
    const item = await tx.feeProfile.update({ where: { id }, data: body })
    return { item: { ...item, value: Number(item.value) } }
  })
})
