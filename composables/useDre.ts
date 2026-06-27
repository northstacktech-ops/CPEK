// CPEK — DRE (ARCHITECTURE §7). ESQUELETO Fase 3.
import type { DreReport, DreMode } from '../types/dre'

export function useDre() {
  const company = useCompanyStore()
  const { api } = useApi()

  async function load(year: number, mode: DreMode = 'realizado', accounts?: string[]) {
    if (!company.activeId) throw new Error('Sem empresa ativa')
    return api<DreReport>('/api/dre', {
      query: { companyId: company.activeId, year, mode, accounts: accounts?.join(',') },
    })
  }

  return { load }
}
