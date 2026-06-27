// CPEK — store de empresa ativa (ARCHITECTURE §11.3). Trocar empresa RESETA o
// contexto (período, dados) — com confirmação na UI (§11.2).
import { defineStore } from 'pinia'
import { usePeriodStore } from './period'

export interface CompanyRef {
  id: string
  name: string
  segment?: string | null
}

export const useCompanyStore = defineStore('company', {
  state: () => ({
    companies: [] as CompanyRef[],
    activeId: null as string | null,
  }),
  getters: {
    active: (s) => s.companies.find((c) => c.id === s.activeId) ?? null,
  },
  actions: {
    setCompanies(list: CompanyRef[]) {
      this.companies = list
      if ((!this.activeId || !list.some((c) => c.id === this.activeId)) && list[0]) {
        this.activeId = list[0].id
      }
    },
    // Trocar empresa reseta o contexto dependente (período). §11.2: confirmar na UI.
    setActive(id: string) {
      this.activeId = id
      const period = usePeriodStore()
      period.reset()
    },
    clear() {
      this.companies = []
      this.activeId = null
    },
  },
})
