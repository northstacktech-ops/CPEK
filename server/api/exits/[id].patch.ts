import { demoExits, isDemoAuth } from '../../utils/demo'
import { apiError, periodClosedError, requireAuth, validateBody } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { updateExitBody } from '../../utils/validators/exits'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  const body = await validateBody(event, updateExitBody)
  if (isDemoAuth(auth)) {
    const idx = demoExits.findIndex((e) => e.id === id)
    if (idx === -1) throw apiError(404, 'NOT_FOUND', 'Saída não encontrada')
    const item = { ...demoExits[idx], ...body, id }
    demoExits[idx] = item
    return { item }
  }

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
