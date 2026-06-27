// CPEK — período ativo (ARCHITECTURE §11.3). ESQUELETO Fase 3.
export function usePeriod() {
  const store = usePeriodStore()
  // TODO(§8): carregar/abrir período via /api/periods e refletir status (OPEN/CLOSED).
  return { store }
}
