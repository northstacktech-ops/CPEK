import { buildDre } from '../../utils/dre'
import { isDemoAuth } from '../../utils/demo'
import { requireAuth, validateQuery } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { dreExportQuery } from '../../utils/validators/dre'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, dreExportQuery)
  const report = isDemoAuth(auth)
    ? { companyId: query.companyId, year: query.year, mode: query.mode, bankAccountIds: query.accounts, lines: [] }
    : await withTenant(auth.tenantId, (tx) =>
        buildDre(tx, {
          companyId: query.companyId,
          year: query.year,
          mode: query.mode,
          bankAccountIds: query.accounts,
        }),
      )

  setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'content-disposition', 'attachment; filename="dre.csv"')
  const header = ['companyId', 'year', 'mode', 'lineCount']
  const row = [report.companyId, report.year, report.mode, report.lines.length]
  return [header.join(','), row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')].join('\n')
})
