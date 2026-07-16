import { apiError, requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { dashboardQuery } from '../utils/validators/dashboard'

function emptyDashboard(year: number) {
  return {
    cards: {
      faturamentoBruto: 0,
      despesas: 0,
      lucroReal: 0,
      ticketMedio: 0,
      vencidos: 0,
      royalties: null as number | null,
      impostoNf: null as number | null,
    },
    accounts: [],
    consolidatedBalance: 0,
    cashFlow: Array.from({ length: 12 }, (_, index) => ({
      date: `${year}-${String(index + 1).padStart(2, '0')}-01`,
      realized: 0,
      planned: 0,
    })),
  }
}

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, dashboardQuery)

  const now = new Date()
  const month = query.month ?? (query.from ? query.from.getMonth() + 1 : now.getMonth() + 1)
  const year = query.year ?? query.from?.getFullYear() ?? now.getFullYear()
  const emptyFlow = emptyDashboard(year).cashFlow

  try {
    return await withTenant(auth.tenantId, async (tx) => {
      const period = await tx.period.findUnique({
        where: { companyId_year_month: { companyId: query.companyId, year, month } },
      })

      if (!period) return emptyDashboard(year)

      const [entries, exits, closings, accounts, company] = await Promise.all([
        tx.entry.findMany({ where: { companyId: query.companyId, periodId: period.id } }),
        tx.exit.findMany({ where: { companyId: query.companyId, periodId: period.id } }),
        tx.closing.findMany({ where: { companyId: query.companyId, periodId: period.id } }),
        tx.bankAccount.findMany({
          where: { companyId: query.companyId, active: true },
          orderBy: { name: 'asc' },
        }),
        tx.company.findUnique({
          where: { id: query.companyId },
          select: { royaltiesPercent: true, impostoNfPercent: true },
        }),
      ])

    const faturamentoEntradas = entries.reduce((total, item) => {
      return total + Number(item.valorServico) + Number(item.deslocamento)
    }, 0)
    const faturamentoFechamentos = closings.reduce((total, item) => total + Number(item.valorFechamento), 0)
    const faturamentoBruto = faturamentoEntradas + faturamentoFechamentos
    const despesas = exits.reduce((total, item) => total + Number(item.valorDespesa), 0)
    const lucroReal = faturamentoBruto - despesas
    const ticketMedio = entries.length ? faturamentoEntradas / entries.length : 0
    // Cards fiscais (configuráveis em /configuracoes): null = percentual não configurado.
    const royaltiesPercent = company?.royaltiesPercent != null ? Number(company.royaltiesPercent) : null
    const impostoNfPercent = company?.impostoNfPercent != null ? Number(company.impostoNfPercent) : null
    const royalties = royaltiesPercent != null ? (faturamentoBruto * royaltiesPercent) / 100 : null
    const faturamentoComNf = entries
      .filter((item) => item.notaFiscal)
      .reduce((total, item) => total + Number(item.valorServico) + Number(item.deslocamento), 0)
    const impostoNf = impostoNfPercent != null ? (faturamentoComNf * impostoNfPercent) / 100 : null
    const today = new Date()
    const vencidos =
      exits
        .filter((item) => item.dataVencimento && item.dataVencimento < today && !item.dataPagamento)
        .reduce((total, item) => total + Number(item.valorDespesa), 0) +
      closings
        .filter((item) => item.dataVencPrev && item.dataVencPrev < today && !item.dataRecebimento)
        .reduce((total, item) => total + Number(item.valorFechamento), 0)

    const accountBalances = accounts.map((account) => {
      const entryTotal = entries
        .filter((item) => item.bankAccountId === account.id && item.dataPagamento)
        .reduce((total, item) => total + Number(item.valorServico) + Number(item.deslocamento), 0)
      const exitTotal = exits
        .filter((item) => item.bankAccountId === account.id && item.dataPagamento)
        .reduce((total, item) => total + Number(item.valorDespesa), 0)
      const closingTotal = closings
        .filter((item) => item.bankAccountId === account.id && item.dataRecebimento)
        .reduce((total, item) => total + Number(item.valorFechamento), 0)

      return {
        bankAccountId: account.id,
        name: account.name,
        balance: Number(account.openingBalance) + entryTotal + closingTotal - exitTotal,
      }
    })

      return {
        cards: { faturamentoBruto, despesas, lucroReal, ticketMedio, vencidos, royalties, impostoNf },
        accounts: accountBalances,
        consolidatedBalance: accountBalances.reduce((total, item) => total + item.balance, 0),
        cashFlow: emptyFlow.map((point, index) => ({
          ...point,
          realized: index + 1 <= month ? lucroReal : 0,
          planned: index + 1 >= month ? lucroReal : 0,
        })),
      }
    })
  } catch (err) {
    // Nunca mostrar R$ 0,00 fingindo sucesso quando a consulta realmente falhou
    // (RLS, conexão, bug) — o usuário precisa saber que os dados não carregaram.
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw apiError(500, 'DASHBOARD_ERROR', 'Não foi possível calcular os dados do painel. Tente novamente em instantes.')
  }
})
