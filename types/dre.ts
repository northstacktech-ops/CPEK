// CPEK — tipos do DRE (ARCHITECTURE §7). Consumido pela tela e pelo export PDF.
import type { DreGroup } from '@prisma/client'

export type DreMode = 'realizado' | 'agendado'

export interface DreCell {
  month: number // 1..12
  value: number
}

export interface DreLine {
  group: DreGroup | 'MARGIN' | 'OPERATING_RESULT' | 'CASH_VARIATION'
  label: string
  cells: DreCell[] // 12 meses
  total: number
  // Quebra por serviço (apenas em Receita Operacional) — §7.1.
  breakdown?: Array<{ serviceId: string; serviceLabel: string; cells: DreCell[]; total: number }>
}

export interface DreReport {
  companyId: string
  year: number
  mode: DreMode
  bankAccountIds: string[] | null
  lines: DreLine[]
}
