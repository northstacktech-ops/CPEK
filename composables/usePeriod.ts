// CPEK - periodo ativo (ARCHITECTURE §11.3).
export function usePeriod() {
  const store = usePeriodStore()
  const { api } = useApi()

  async function ensure(companyId: string) {
    const current = await api<{
      items: Array<{ id: string; companyId: string; month: number; year: number; status: 'OPEN' | 'CLOSED' }>
    }>('/api/periods', { query: { companyId } })

    const found = current.items.find((item) => item.month === store.month && item.year === store.year)
    if (found) {
      store.periodId = found.id
      store.status = found.status
      return found
    }

    const created = await api<{
      item: { id: string; companyId: string; month: number; year: number; status: 'OPEN' | 'CLOSED' }
    }>('/api/periods', {
      method: 'POST',
      body: { companyId, month: store.month, year: store.year },
    })

    store.periodId = created.item.id
    store.status = created.item.status
    return created.item
  }

  return { store, ensure }
}
