import { toCsv } from '../../utils/csv'
import { buildDre } from '../../utils/dre'
import { apiError, requireAuth, validateQuery } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { dreExportQuery } from '../../utils/validators/dre'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, dreExportQuery)
  // Export em PDF ainda não foi implementado (renderDrePdf é um stub) — falhar
  // explicitamente em vez de devolver CSV silenciosamente no lugar do PDF pedido.
  if (query.format === 'pdf') {
    throw apiError(501, 'PDF_EXPORT_NOT_IMPLEMENTED', 'Exportação em PDF ainda não está disponível. Use o formato CSV.')
  }

  const report = await withTenant(auth.tenantId, (tx) =>
    buildDre(tx, {
      companyId: query.companyId,
      year: query.year,
      mode: query.mode,
      bankAccountIds: query.accounts,
    }),
  )

  setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'content-disposition', 'attachment; filename="dre.csv"')
  return toCsv(
    [{ companyId: report.companyId, year: report.year, mode: report.mode, lineCount: report.lines.length }],
    ['companyId', 'year', 'mode', 'lineCount'],
  )
})
