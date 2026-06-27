// GET /api/dre/export?...&format=pdf|csv — export do DRE (ARCHITECTURE §7, §8).
import { requireAuth, validateQuery, notImplemented } from '../../utils/http'
import { dreExportQuery } from '../../utils/validators/dre'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  validateQuery(event, dreExportQuery)
  // TODO(§7): withTenant → buildDre → renderDrePdf (pdf) ou toCsv (csv).
  return notImplemented('§7')
})
