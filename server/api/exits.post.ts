import { isDemoAuth } from '../utils/demo'
import type { Prisma } from '@prisma/client'
import { buildCustomSnapshot } from '../utils/customFields'
import { periodClosedError, requireAuth, validateBody } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { createExitBody } from '../utils/validators/exits'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = await validateBody(event, createExitBody)
  if (isDemoAuth(auth)) return { item: { id: `demo-exit-${Date.now()}`, ...body } }

  return withTenant(auth.tenantId, async (tx) => {
    const period = await tx.period.findUnique({ where: { id: body.periodId } })
    if (!period || period.status === 'CLOSED') throw periodClosedError()
    const customSnapshot = await buildCustomSnapshot(tx, body.companyId, 'EXIT', body.custom ?? {})
    const { custom, ...data } = body
    void custom
    const item = await tx.exit.create({
      data: { tenantId: auth.tenantId, createdById: auth.userId, customSnapshot: customSnapshot as unknown as Prisma.InputJsonValue, ...data },
    })
    return { item }
  })
})
