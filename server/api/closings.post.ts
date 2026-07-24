import type { Prisma } from '@prisma/client'
import { buildCustomSnapshot } from '../utils/customFields'
import { requireAuth, validateBody } from '../utils/http'
import { resolvePeriod } from '../utils/period'
import { withTenant } from '../utils/withTenant'
import { createClosingBody } from '../utils/validators/closings'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = await validateBody(event, createClosingBody)

  return withTenant(auth.tenantId, async (tx) => {
    const period = await resolvePeriod(tx, auth.tenantId, body.companyId, body.dataFechamento)
    const customSnapshot = await buildCustomSnapshot(tx, body.companyId, 'CLOSING', body.custom ?? {})
    const { custom, ...data } = body
    void custom
    const item = await tx.closing.create({
      data: { tenantId: auth.tenantId, createdById: auth.userId, customSnapshot: customSnapshot as unknown as Prisma.InputJsonValue, ...data, periodId: period.id },
    })
    return { item }
  })
})
