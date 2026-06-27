// POST /api/bank-accounts — criar conta bancária (ARCHITECTURE §5, §8).
import { requireAuth, validateBody, notImplemented } from '../utils/http'
import { createBankAccountBody } from '../utils/validators/bankAccounts'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  await validateBody(event, createBankAccountBody)
  // TODO(§5): withTenant → tx.bankAccount.create.
  return notImplemented('§5')
})
