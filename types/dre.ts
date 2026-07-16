// CPEK — tipos do DRE (ARCHITECTURE §7, ajustado ao formato pedido pelo Cleber:
// Faturamento − Despesas Fixas − Despesas Variáveis = Resultado, Margem de
// Contribuição e Margem Líquida (%) exibidas ao final).
export type DreMode = 'realizado' | 'agendado'

export interface DreRow {
  id: string
  label: string
  indent: number
  sign: 1 | -1
  bold?: boolean
  percent?: boolean
  separator?: boolean
  highlight?: boolean
  valores: number[] // 12 meses (índice 0 = Janeiro)
  children?: DreRow[]
}

export interface DreReport {
  companyId: string
  year: number
  mode: DreMode
  rows: DreRow[]
}
