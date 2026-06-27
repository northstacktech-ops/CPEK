// CPEK — carrega empresas do tenant e sincroniza a store (ARCHITECTURE §11.3).
export function useCompany() {
  const store = useCompanyStore()
  const { api } = useApi()

  async function load() {
    const res = await api<{ items: Array<{ id: string; name: string; segment?: string | null }> }>(
      '/api/companies',
    )
    store.setCompanies(res.items)
  }

  return { store, load }
}
