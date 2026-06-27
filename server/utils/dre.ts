// ============================================================================
// CPEK — Motor de DRE (ARCHITECTURE §7). ESQUELETO da Fase 3.
//
// Agrega por dreGroup, serviceId, mês e modo, preferindo agregação NO BANCO
// (Prisma groupBy / SQL agregado DENTRO de withTenant) em vez de carregar linhas.
// Resultado tipado (DreReport) consumido pela tela e pelo export PDF.
// ============================================================================
import type { Prisma } from '@prisma/client'
import type { DreMode, DreReport } from '../../types/dre'

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
  bankAccountIds?: string[] | null
}

/**
 * Monta o DRE contábil. DEVE rodar dentro de withTenant (recebe o tx).
 * TODO(§7.3): agregação por dreGroup/serviceId/mês via tx.$queryRaw/groupBy;
 *   realizado = liquidação no período (dataPagamento/dataRecebimento != null),
 *   agendado = previsto por vencimento/competência; quebra por serviço na Receita
 *   Operacional; filtro por bankAccountId; linhas Margem/Resultado/Variação.
 */
export async function buildDre(
  _tx: Prisma.TransactionClient,
  params: BuildDreParams,
): Promise<DreReport> {
  // TODO(§7): implementar agregação real.
  return {
    companyId: params.companyId,
    year: params.year,
    mode: params.mode,
    bankAccountIds: params.bankAccountIds ?? null,
    lines: [],
  }
}
