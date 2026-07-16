// ============================================================================
// CPEK — Motor de DRE (ARCHITECTURE §7, adaptado ao formato pedido pelo Cleber
// em reunião: Faturamento − Despesas Fixas − Despesas Variáveis = Resultado
// Final, com Margem de Contribuição e Margem Líquida (%) exibidas ao final).
//
// Realizado: soma pela data de liquidação (dataPagamento/dataRecebimento).
// Agendado (previsto): soma pela data de competência/vencimento, independente
// de já ter sido liquidado ou não.
//
// Despesas são separadas em Fixas/Variáveis pelo CostCenter.costType do
// centro de custo do lançamento; sem centro de custo cai em "Outras despesas"
// (Variável, pra não sumir do total).
// ============================================================================
import type { Prisma } from '@prisma/client'
import type { DreMode, DreReport, DreRow } from '../../types/dre'

/** Margem de Contribuição (R$) = Receita Operacional − Custo Operacional (§7.1). */
export function computeMargin(operatingRevenue: number, operatingCost: number): number {
  return round2(operatingRevenue - operatingCost)
}

/** Arredondamento explícito (regra crítica 3 / §2.4). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export interface BuildDreParams {
  companyId: string
  year: number
  mode: DreMode
}

function emptyMonths(): number[] {
  return Array.from({ length: 12 }, () => 0)
}

/** Índice do mês (0-11) da data informada, ou null se fora do ano do relatório. */
function monthIndex(date: Date | null | undefined, year: number): number | null {
  if (!date) return null
  return date.getFullYear() === year ? date.getMonth() : null
}

interface Bucket {
  label: string
  values: number[]
}

function addTo(map: Map<string, Bucket>, key: string, label: string, month: number, amount: number) {
  if (!map.has(key)) map.set(key, { label, values: emptyMonths() })
  map.get(key)!.values[month] += amount
}

function childrenFrom(map: Map<string, Bucket>): DreRow[] {
  return [...map.entries()]
    .sort(([, a], [, b]) => a.label.localeCompare(b.label))
    .map(([key, bucket]) => ({
      id: key,
      label: bucket.label,
      indent: 1,
      sign: 1 as const,
      valores: bucket.values.map(round2),
    }))
}

/** Monta o DRE (ARCHITECTURE §7, formato Faturamento/Fixas/Variáveis). DEVE rodar dentro de withTenant. */
export async function buildDre(
  tx: Prisma.TransactionClient,
  params: BuildDreParams,
): Promise<DreReport> {
  const { companyId, year, mode } = params

  const [entries, exits, closings, services, costCenters] = await Promise.all([
    tx.entry.findMany({ where: { companyId } }),
    tx.exit.findMany({ where: { companyId } }),
    tx.closing.findMany({ where: { companyId } }),
    tx.catalogValue.findMany({ where: { companyId, kind: 'SERVICE' } }),
    tx.costCenter.findMany({ where: { companyId } }),
  ])

  const serviceLabel = new Map(services.map((s) => [s.id, s.label]))
  const costCenterById = new Map(costCenters.map((c) => [c.id, c]))

  const revenueTotal = emptyMonths()
  const revenueByService = new Map<string, Bucket>()

  for (const entry of entries) {
    const date = mode === 'realizado' ? entry.dataPagamento : (entry.dataServico ?? entry.createdAt)
    const month = monthIndex(date, year)
    if (month === null) continue
    const amount = Number(entry.valorServico) + Number(entry.deslocamento)
    revenueTotal[month] += amount
    const key = entry.serviceId ?? '__sem_servico__'
    addTo(revenueByService, key, entry.serviceId ? (serviceLabel.get(entry.serviceId) ?? 'Sem serviço') : 'Sem serviço', month, amount)
  }

  for (const closing of closings) {
    const date = mode === 'realizado' ? closing.dataRecebimento : (closing.dataVencPrev ?? closing.createdAt)
    const month = monthIndex(date, year)
    if (month === null) continue
    revenueTotal[month] += Number(closing.valorFechamento)
  }

  const fixedTotal = emptyMonths()
  const variableTotal = emptyMonths()
  const fixedByCostCenter = new Map<string, Bucket>()
  const variableByCostCenter = new Map<string, Bucket>()

  for (const exit of exits) {
    const date = mode === 'realizado' ? exit.dataPagamento : (exit.dataVencimento ?? exit.dataLancamento ?? exit.createdAt)
    const month = monthIndex(date, year)
    if (month === null) continue
    const amount = Number(exit.valorDespesa)
    const costCenter = exit.costCenterId ? costCenterById.get(exit.costCenterId) : null
    const key = costCenter?.id ?? '__sem_centro_custo__'
    const label = costCenter?.label ?? 'Outras despesas'
    if (costCenter?.costType === 'FIXED') {
      fixedTotal[month] += amount
      addTo(fixedByCostCenter, key, label, month, amount)
    } else {
      variableTotal[month] += amount
      addTo(variableByCostCenter, key, label, month, amount)
    }
  }

  const resultadoFinal = revenueTotal.map((v, i) => v - fixedTotal[i] - variableTotal[i])
  const margemContribuicao = revenueTotal.map((v, i) => v - variableTotal[i])
  const pct = (numerator: number[], denominator: number[]) =>
    numerator.map((v, i) => (denominator[i] ? round2((v / denominator[i]) * 100) : 0))

  const rows: DreRow[] = [
    {
      id: 'receita-op',
      label: 'Faturamento (Receita Operacional)',
      indent: 0,
      bold: true,
      sign: 1,
      valores: revenueTotal.map(round2),
      children: childrenFrom(revenueByService),
    },
    {
      id: 'despesas-fixas',
      label: '(−) Despesas Fixas',
      indent: 0,
      bold: true,
      sign: -1,
      valores: fixedTotal.map(round2),
      children: childrenFrom(fixedByCostCenter),
    },
    {
      id: 'despesas-variaveis',
      label: '(−) Despesas Variáveis',
      indent: 0,
      bold: true,
      sign: -1,
      valores: variableTotal.map(round2),
      children: childrenFrom(variableByCostCenter),
    },
    {
      id: 'resultado-final',
      label: '= Resultado Final',
      indent: 0,
      bold: true,
      separator: true,
      highlight: true,
      sign: 1,
      valores: resultadoFinal.map(round2),
    },
    {
      id: 'margem',
      label: 'Margem de Contribuição',
      indent: 0,
      bold: true,
      separator: true,
      sign: 1,
      valores: margemContribuicao.map(round2),
    },
    {
      id: 'margem-pct',
      label: 'Margem de Contribuição (%)',
      indent: 1,
      sign: 1,
      percent: true,
      valores: pct(margemContribuicao, revenueTotal),
    },
    {
      id: 'margem-liquida-pct',
      label: 'Margem Líquida (%)',
      indent: 1,
      sign: 1,
      percent: true,
      valores: pct(resultadoFinal, revenueTotal),
    },
  ]

  return { companyId, year, mode, rows }
}
