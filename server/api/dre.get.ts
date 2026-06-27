// GET /api/dre?companyId&year&mode=realizado|agendado&accounts= — DRE contábil.
// ARCHITECTURE §7. Agregação dentro de withTenant via server/utils/dre.ts.
import { requireAuth, validateQuery, notImplemented } from '../utils/http'
import { dreQuery } from '../utils/validators/dre'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const _q = validateQuery(event, dreQuery)
  // TODO(§7.3): return withTenant(auth.tenantId, tx => buildDre(tx, { ... }))
  void auth
  return notImplemented('§7')
})
