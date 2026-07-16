import { apiError, periodClosedError, requireAuth, validateBody } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { updateExitBody } from '../../utils/validators/exits'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  const body = await validateBody(event, updateExitBody)

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.exit.findUnique({ where: { id }, include: { period: true } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Saída não encontrada')
    if (current.period.status === 'CLOSED') throw periodClosedError()
    const { custom, ...data } = body
    void custom
    const item = await tx.exit.update({ where: { id }, data })
    return { item }
  })
})
