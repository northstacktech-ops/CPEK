import type { Prisma } from '@prisma/client'
import { buildCustomSnapshot } from '../../utils/customFields'
import { apiError, requireAuth, validateBody } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { updateExitBody } from '../../utils/validators/exits'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  const body = await validateBody(event, updateExitBody)

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.exit.findUnique({ where: { id } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Saída não encontrada')
    const { custom, ...data } = body
    const customSnapshot = custom !== undefined ? await buildCustomSnapshot(tx, current.companyId, 'EXIT', custom) : undefined
    const item = await tx.exit.update({
      where: { id },
      data: { ...data, ...(customSnapshot ? { customSnapshot: customSnapshot as unknown as Prisma.InputJsonValue } : {}) },
    })
    return { item }
  })
})
