import { requireAuth, validateBody } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { createBankAccountBody } from '../utils/validators/bankAccounts'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const body = await validateBody(event, createBankAccountBody)

  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.bankAccount.create({
      data: {
        tenantId: auth.tenantId,
        companyId: body.companyId,
        name: body.name,
        openingBalance: body.openingBalance,
      },
    })
    return { item }
  })
})
