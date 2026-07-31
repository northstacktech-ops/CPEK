import { apiError, requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { dashboardQuery } from '../utils/validators/dashboard'

function emptyDashboard(year: number, vencidos = 0) {
  return {
    cards: {
      faturamentoBruto: 0,
      despesas: 0,
      lucroReal: 0,
      lucroRealSemDespesas: 0,
      ticketMedio: 0,
      vencidos,
      royalties: null as number | null,
      impostoNf: null as number | null,
      retorno: 0,
      pesquisa: 0,
    },
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
      const today = new Date()

      // Vencidos nunca depende do período selecionado no dashboard — soma TODOS os
      // pendentes vencidos da empresa (qualquer mês), não só o mês em exibição.
      const [period, vencidosExits, vencidosClosings] = await Promise.all([
        tx.period.findUnique({
          where: { companyId_year_month: { companyId: query.companyId, year, month } },
        }),
        tx.exit.findMany({
          where: { companyId: query.companyId, dataVencimento: { lt: today }, dataPagamento: null },
        }),
        tx.closing.findMany({
          where: { companyId: query.companyId, dataVencPrev: { lt: today }, dataRecebimento: null },
        }),
      ])
      const vencidos =
        vencidosExits.reduce((total, item) => total + Number(item.valorDespesa), 0) +
        vencidosClosings.reduce((total, item) => total + Number(item.valorFechamento), 0)

      if (!period) return emptyDashboard(year, vencidos)

      const [entries, exits, company] = await Promise.all([
        tx.entry.findMany({ where: { companyId: query.companyId, periodId: period.id } }),
        tx.exit.findMany({ where: { companyId: query.companyId, periodId: period.id } }),
        tx.company.findUnique({
          where: { id: query.companyId },
          select: { royaltiesPercent: true, impostoNfPercent: true },
        }),
      ])

      // Fechamento não entra em nenhum indicador do dashboard além de Vencidos —
      // faturamento/lucro/royalties/imposto consideram só as entradas do período.
      const faturamentoEntradas = entries.reduce((total, item) => {
        return total + Number(item.valorServico) + Number(item.deslocamento)
      }, 0)
      const faturamentoServico = entries.reduce((total, item) => total + Number(item.valorServico), 0)
      const faturamentoBruto = faturamentoEntradas
      const despesas = exits.reduce((total, item) => total + Number(item.valorDespesa), 0)
      const totalRetorno = entries.reduce((total, item) => total + Number(item.retorno ?? 0), 0)
      const totalPesquisa = entries.reduce((total, item) => total + Number(item.pesquisa ?? 0), 0)
      const ticketMedio = entries.length ? faturamentoEntradas / entries.length : 0
      // Cards fiscais (configuráveis em /configuracoes): null = percentual não configurado.
      const royaltiesPercent = company?.royaltiesPercent != null ? Number(company.royaltiesPercent) : null
      const impostoNfPercent = company?.impostoNfPercent != null ? Number(company.impostoNfPercent) : null
      // Royalties incidem só sobre o valor do serviço (deslocamento não é cobrado), já
      // descontado do retorno — não sobre o faturamento bruto (que inclui deslocamento).
      const royalties = royaltiesPercent != null ? ((faturamentoServico - totalRetorno) * royaltiesPercent) / 100 : null
      const faturamentoComNf = entries
        .filter((item) => item.notaFiscal)
        .reduce((total, item) => total + Number(item.valorServico) + Number(item.deslocamento), 0)
      const impostoNf = impostoNfPercent != null ? (faturamentoComNf * impostoNfPercent) / 100 : null
      // Lucro real = o que sobra depois de pagar despesas, royalties, imposto, pesquisa e o retorno.
      const lucroReal = faturamentoBruto - despesas - (royalties ?? 0) - (impostoNf ?? 0) - totalRetorno - totalPesquisa
      // Mesmo lucro real, mas sem descontar despesas (pedido do cliente para comparar
      // o resultado da operação financeira isolado do gasto operacional).
      const lucroRealSemDespesas = lucroReal + despesas

      return {
        cards: {
          faturamentoBruto,
          despesas,
          lucroReal,
          lucroRealSemDespesas,
          ticketMedio,
          vencidos,
          royalties,
          impostoNf,
          retorno: totalRetorno,
          pesquisa: totalPesquisa,
        },
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
