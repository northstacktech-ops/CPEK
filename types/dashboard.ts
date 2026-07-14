// CPEK — tipos do dashboard (ARCHITECTURE §12).
export interface DashboardCards {
  faturamentoBruto: number
  despesas: number
  lucroReal: number
  ticketMedio: number
  // 5º card — default "Vencidos" (D1, §19). TODO(decisão): confirmar vs "A Receber".
  vencidos: number
  // Cards fiscais (2ª linha): null = percentual não configurado em /configuracoes.
  royalties: number | null
  impostoNf: number | null
}

export interface BankAccountBalance {
  bankAccountId: string
  name: string
  balance: number
}

export interface CashFlowPoint {
  date: string
  realized: number
  planned: number
}

export interface DashboardData {
  cards: DashboardCards
  accounts: BankAccountBalance[]
  consolidatedBalance: number
  cashFlow: CashFlowPoint[]
}
