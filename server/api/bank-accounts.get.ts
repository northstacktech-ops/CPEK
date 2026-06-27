// GET /api/bank-accounts?companyId — contas + saldo consolidado (ARCHITECTURE §12).
import { requireAuth, validateQuery, notImplemented } from '../utils/http'
import { listBankAccountsQuery } from '../utils/validators/bankAccounts'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  validateQuery(event, listBankAccountsQuery)
  // TODO(§12): saldo = abertura + entradas − saídas (± fechamentos) liquidados.
  return notImplemented('§12')
})
