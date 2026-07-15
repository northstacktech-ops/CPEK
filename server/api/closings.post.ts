import { demoClosings, isDemoAuth } from '../utils/demo'
import type { Prisma } from '@prisma/client'
import { buildCustomSnapshot } from '../utils/customFields'
import { periodClosedError, requireAuth, validateBody } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { createClosingBody } from '../utils/validators/closings'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = await validateBody(event, createClosingBody)
  if (isDemoAuth(auth)) {
    const item = { id: `demo-closing-${Date.now()}`, ...body }
    demoClosings.unshift(item)
    return { item }
  }

  return withTenant(auth.tenantId, async (tx) => {
    const period = await tx.period.findUnique({ where: { id: body.periodId } })
    if (!period || period.status === 'CLOSED') throw periodClosedError()
    const customSnapshot = await buildCustomSnapshot(tx, body.companyId, 'CLOSING', body.custom ?? {})
    const { custom, ...data } = body
    void custom
    const item = await tx.closing.create({
      data: { tenantId: auth.tenantId, createdById: auth.userId, customSnapshot: customSnapshot as unknown as Prisma.InputJsonValue, ...data },
    })
    return { item }
  })
})
