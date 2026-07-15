import { demoCostCenters, isDemoAuth } from '../../utils/demo'
import { apiError, requireAuth, validateBody } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { updateCostCenterBody } from '../../utils/validators/costCenters'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  const body = await validateBody(event, updateCostCenterBody)
  if (isDemoAuth(auth)) {
    const item = demoCostCenters.find((c) => c.id === id)
    if (!item) throw apiError(404, 'NOT_FOUND', 'Item não encontrado')
    Object.assign(item, body)
    return { item }
  }

  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.costCenter.update({ where: { id }, data: body })
    return { item }
  })
})
