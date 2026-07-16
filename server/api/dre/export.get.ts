import type { DreRow } from '../../../types/dre'
import { toCsv } from '../../utils/csv'
import { buildDre } from '../../utils/dre'
import { apiError, requireAuth, validateQuery } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { dreExportQuery } from '../../utils/validators/dre'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function flatten(rows: DreRow[], prefix = ''): Array<Record<string, unknown>> {
  return rows.flatMap((row) => {
    const label = prefix + row.label
    const record: Record<string, unknown> = { linha: label }
    row.valores.forEach((v, i) => { record[MESES[i]] = row.percent ? `${v}%` : v.toFixed(2) })
    record.total = row.percent ? '' : row.valores.reduce((a, b) => a + b, 0).toFixed(2)
    return [record, ...flatten(row.children ?? [], `${prefix}  `)]
  })
}

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
    }),
  )

  setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'content-disposition', 'attachment; filename="dre.csv"')
  return toCsv(flatten(report.rows), ['linha', ...MESES, 'total'])
})
