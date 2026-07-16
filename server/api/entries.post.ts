import type { Prisma } from '@prisma/client'
import { buildCustomSnapshot } from '../utils/customFields'
import { apiError, periodClosedError, requireAuth, validateBody } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { createEntryBody } from '../utils/validators/entries'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = await validateBody(event, createEntryBody)

  return withTenant(auth.tenantId, async (tx) => {
    const period = await tx.period.findUnique({ where: { id: body.periodId } })
    if (!period) throw apiError(404, 'NOT_FOUND', 'Período não encontrado')
    if (period.companyId !== body.companyId) throw apiError(400, 'COMPANY_PERIOD_MISMATCH', 'Período não pertence à empresa informada')
    if (period.status === 'CLOSED') throw periodClosedError()
    const customSnapshot = await buildCustomSnapshot(tx, body.companyId, 'ENTRY', body.custom ?? {})
    const { custom, ...data } = body
    void custom
    const item = await tx.entry.create({
      data: { tenantId: auth.tenantId, createdById: auth.userId, customSnapshot: customSnapshot as unknown as Prisma.InputJsonValue, ...data },
    })
    return { item }
  })
})
