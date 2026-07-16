import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listBankAccountsQuery } from '../utils/validators/bankAccounts'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listBankAccountsQuery)

  return withTenant(auth.tenantId, async (tx) => {
    const [accounts, entries, exits, closings] = await Promise.all([
      tx.bankAccount.findMany({
        where: { companyId: query.companyId, active: true },
        orderBy: { name: 'asc' },
      }),
      tx.entry.findMany({ where: { companyId: query.companyId, dataPagamento: { not: null } } }),
      tx.exit.findMany({ where: { companyId: query.companyId, dataPagamento: { not: null } } }),
      tx.closing.findMany({ where: { companyId: query.companyId, dataRecebimento: { not: null } } }),
    ])

    const items = accounts.map((account) => {
      const entryTotal = entries
        .filter((entry) => entry.bankAccountId === account.id)
        .reduce((total, entry) => total + Number(entry.valorServico) + Number(entry.deslocamento), 0)
      const exitTotal = exits
        .filter((exit) => exit.bankAccountId === account.id)
        .reduce((total, exit) => total + Number(exit.valorDespesa), 0)
      const closingTotal = closings
        .filter((closing) => closing.bankAccountId === account.id)
        .reduce((total, closing) => total + Number(closing.valorFechamento), 0)

      return {
        id: account.id,
        bankAccountId: account.id,
        name: account.name,
        balance: Number(account.openingBalance) + entryTotal + closingTotal - exitTotal,
      }
    })

    return { items }
  })
})
