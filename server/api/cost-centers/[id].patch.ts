import { apiError, requireAuth, validateBody } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { updateCostCenterBody } from '../../utils/validators/costCenters'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  const body = await validateBody(event, updateCostCenterBody)

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.costCenter.findUnique({ where: { id } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Centro de custo não encontrado')
    const item = await tx.costCenter.update({ where: { id }, data: body })
    return { item }
  })
})
