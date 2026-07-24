// CPEK — store de período ativo (mês/ano) (ARCHITECTURE §11.3).
import { defineStore } from 'pinia'

export const usePeriodStore = defineStore('period', {
  state: () => ({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    periodId: null as string | null,
  }),
  getters: {
    label: (s) => `${String(s.month).padStart(2, '0')}/${s.year}`,
  },
  actions: {
    set(month: number, year: number) {
      this.month = month
      this.year = year
    },
    reset() {
      this.periodId = null
    },
  },
})
