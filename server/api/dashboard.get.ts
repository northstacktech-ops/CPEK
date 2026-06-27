// GET /api/dashboard?companyId&from&to — 5 cards + contas + fluxo acumulado.
// ARCHITECTURE §12 (fórmulas) / §8. 5º card = "Vencidos" (default D1, §19).
import { requireAuth, validateQuery, notImplemented } from '../utils/http'
import { dashboardQuery } from '../utils/validators/dashboard'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const _q = validateQuery(event, dashboardQuery)
  // TODO(§12): withTenant(auth.tenantId) → agregar cards (Faturamento, Despesas,
  //   Lucro Real, Ticket Médio, Vencidos), saldos de contas + Saldo Consolidado,
  //   e a série de Fluxo Acumulado (realizado vs previsto).
  void auth
  return notImplemented('§12')
})
