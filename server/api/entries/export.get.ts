import { demoEntries, isDemoAuth } from '../../utils/demo'
import { requireAuth, validateQuery } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { listEntriesQuery } from '../../utils/validators/entries'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listEntriesQuery)
  const rows = isDemoAuth(auth)
    ? demoEntries
    : await withTenant(auth.tenantId, (tx) =>
        tx.entry.findMany({
          where: { companyId: query.companyId, ...(query.periodId ? { periodId: query.periodId } : {}) },
          orderBy: { createdAt: 'desc' },
        }),
      )

  setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'content-disposition', 'attachment; filename="entradas.csv"')
  const header = ['id', 'data', 'cliente', 'servico', 'valor', 'deslocamento', 'status']
  const body = rows.map((row: any) =>
    [
      row.id,
      row.data ?? row.dataServico?.toISOString?.() ?? '',
      row.cliente ?? row.contactId ?? '',
      row.servico ?? row.serviceId ?? '',
      row.valor ?? row.valorServico ?? '',
      row.deslocamento ?? '',
      row.status ?? row.statusId ?? '',
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(','),
  )
  return [header.join(','), ...body].join('\n')
})
