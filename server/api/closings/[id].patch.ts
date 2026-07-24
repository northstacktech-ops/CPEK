import type { Prisma } from '@prisma/client'
import { buildCustomSnapshot } from '../../utils/customFields'
import { apiError, periodClosedError, requireAuth, validateBody } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { updateClosingBody } from '../../utils/validators/closings'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  const body = await validateBody(event, updateClosingBody)

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.closing.findUnique({ where: { id }, include: { period: true } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Fechamento não encontrado')
    if (current.period.status === 'CLOSED') throw periodClosedError()
    const { custom, ...data } = body
    const customSnapshot = custom !== undefined ? await buildCustomSnapshot(tx, current.companyId, 'CLOSING', custom) : undefined
    const item = await tx.closing.update({
      where: { id },
      data: { ...data, ...(customSnapshot ? { customSnapshot: customSnapshot as unknown as Prisma.InputJsonValue } : {}) },
    })
    return { item }
  })
})
