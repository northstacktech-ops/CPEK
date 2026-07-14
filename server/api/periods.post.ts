import { randomUUID } from 'node:crypto'
import { isDemoAuth } from '../utils/demo'
import { requireAuth, validateBody } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { createPeriodBody } from '../utils/validators/periods'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = await validateBody(event, createPeriodBody)
  if (isDemoAuth(auth)) return { item: { id: randomUUID(), status: 'OPEN', ...body } }

  return await withTenant(auth.tenantId, async (tx) => {
    const item = await tx.period.upsert({
      where: { companyId_year_month: { companyId: body.companyId, year: body.year, month: body.month } },
      update: {},
      create: { tenantId: auth.tenantId, ...body },
    })
    return { item }
  })
})
