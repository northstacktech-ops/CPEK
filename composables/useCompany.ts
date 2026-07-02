// CPEK — carrega empresas do tenant e sincroniza a store (ARCHITECTURE §11.3).
import type { CompanyRef } from '../stores/company'

export function useCompany() {
  const store = useCompanyStore()
  const { api } = useApi()

  async function load() {
    const res = await api<{ items: CompanyRef[] }>('/api/companies')
    store.setCompanies(res.items)
  }

  return { store, load }
}
