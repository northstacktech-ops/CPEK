import { demoClosings, isDemoAuth } from '../../utils/demo'
import { requireAuth, validateQuery } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { listClosingsQuery } from '../../utils/validators/closings'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listClosingsQuery)
  const rows = isDemoAuth(auth)
    ? demoClosings
    : await withTenant(auth.tenantId, (tx) =>
        tx.closing.findMany({
          where: { companyId: query.companyId, ...(query.periodId ? { periodId: query.periodId } : {}) },
          orderBy: { createdAt: 'desc' },
        }),
      )

  setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'content-disposition', 'attachment; filename="fechamentos.csv"')
  const header = ['id', 'cliente', 'valor', 'vencimento', 'recebimento', 'status']
  const body = rows.map((row: any) =>
    [
      row.id,
      row.cliente ?? row.contactId ?? '',
      row.valor ?? row.valorFechamento ?? '',
      row.vencimento ?? row.dataVencPrev?.toISOString?.() ?? '',
      row.recebimento ?? row.dataRecebimento?.toISOString?.() ?? '',
      row.status ?? row.statusId ?? '',
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(','),
  )
  return [header.join(','), ...body].join('\n')
})
