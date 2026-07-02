import { isDemoAuth } from '../../utils/demo'
import { apiError, periodClosedError, requireAuth, validateBody } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { updateClosingBody } from '../../utils/validators/closings'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  const body = await validateBody(event, updateClosingBody)
  if (isDemoAuth(auth)) return { item: { id, ...body } }

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.closing.findUnique({ where: { id }, include: { period: true } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Fechamento não encontrado')
    if (current.period.status === 'CLOSED') throw periodClosedError()
    const { custom, ...data } = body
    void custom
    const item = await tx.closing.update({ where: { id }, data })
    return { item }
  })
})
