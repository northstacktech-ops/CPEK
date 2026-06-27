// CPEK — dados do dashboard (ARCHITECTURE §12). ESQUELETO Fase 1.
import type { DashboardData } from '../types/dashboard'

export function useDashboard() {
  const company = useCompanyStore()
  const period = usePeriodStore()
  const { api } = useApi()

  async function load(): Promise<DashboardData> {
    if (!company.activeId) throw new Error('Sem empresa ativa')
    // TODO(§12): revalidar ao mudar empresa/período.
    return api<DashboardData>('/api/dashboard', {
      query: { companyId: company.activeId, month: period.month, year: period.year },
    })
  }

  return { load }
}
