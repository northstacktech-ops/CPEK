import { isDemoAuth } from '../utils/demo'
import { buildDre } from '../utils/dre'
import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { dreQuery } from '../utils/validators/dre'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, dreQuery)
  if (isDemoAuth(auth)) {
    return {
      companyId: query.companyId,
      year: query.year,
      mode: query.mode,
      bankAccountIds: query.accounts,
      lines: [],
    }
  }

  return withTenant(auth.tenantId, (tx) =>
    buildDre(tx, {
      companyId: query.companyId,
      year: query.year,
      mode: query.mode,
      bankAccountIds: query.accounts,
    }),
  )
})
