import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listBankAccountsQuery } from '../utils/validators/bankAccounts'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listBankAccountsQuery)

  return withTenant(auth.tenantId, async (tx) => {
    // Soma por conta feita no banco (groupBy) em vez de trazer todo o histórico
    // de lançamentos pra memória e somar em JS — o histórico só cresce com o
    // tempo, então isso mantém o endpoint rápido independente do volume.
    const [accounts, entryTotals, exitTotals, closingTotals] = await Promise.all([
      tx.bankAccount.findMany({
        where: { companyId: query.companyId, active: true },
        orderBy: { name: 'asc' },
      }),
      tx.entry.groupBy({
        by: ['bankAccountId'],
        where: { companyId: query.companyId, dataPagamento: { not: null }, bankAccountId: { not: null } },
        _sum: { valorServico: true, deslocamento: true },
      }),
      tx.exit.groupBy({
        by: ['bankAccountId'],
        where: { companyId: query.companyId, dataPagamento: { not: null }, bankAccountId: { not: null } },
        _sum: { valorDespesa: true },
      }),
      tx.closing.groupBy({
        by: ['bankAccountId'],
        where: { companyId: query.companyId, dataRecebimento: { not: null }, bankAccountId: { not: null } },
        _sum: { valorFechamento: true },
      }),
    ])

    const entryByAccount = new Map(entryTotals.map((t) => [t.bankAccountId, t]))
    const exitByAccount = new Map(exitTotals.map((t) => [t.bankAccountId, t]))
    const closingByAccount = new Map(closingTotals.map((t) => [t.bankAccountId, t]))

    const items = accounts.map((account) => {
      const entryTotal = entryByAccount.get(account.id)
      const exitTotal = exitByAccount.get(account.id)
      const closingTotal = closingByAccount.get(account.id)
      const entrySum = Number(entryTotal?._sum.valorServico ?? 0) + Number(entryTotal?._sum.deslocamento ?? 0)
      const closingSum = Number(closingTotal?._sum.valorFechamento ?? 0)
      const exitSum = Number(exitTotal?._sum.valorDespesa ?? 0)

      return {
        id: account.id,
        bankAccountId: account.id,
        name: account.name,
        balance: Number(account.openingBalance) + entrySum + closingSum - exitSum,
      }
    })

    return { items }
  })
})
