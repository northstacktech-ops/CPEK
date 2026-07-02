import { demoExits, isDemoAuth } from '../../utils/demo'
import { requireAuth, validateQuery } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { listExitsQuery } from '../../utils/validators/exits'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listExitsQuery)
  const rows = isDemoAuth(auth)
    ? demoExits
    : await withTenant(auth.tenantId, (tx) =>
        tx.exit.findMany({
          where: { companyId: query.companyId, ...(query.periodId ? { periodId: query.periodId } : {}) },
          orderBy: { createdAt: 'desc' },
        }),
      )

  setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'content-disposition', 'attachment; filename="saidas.csv"')
  const header = ['id', 'data', 'fornecedor', 'categoria', 'centroCusto', 'valor', 'vencimento', 'status']
  const body = rows.map((row: any) =>
    [
      row.id,
      row.data ?? row.dataLancamento?.toISOString?.() ?? '',
      row.fornecedor ?? row.contactId ?? '',
      row.categoria ?? row.categoryId ?? '',
      row.centroCusto ?? row.costCenterId ?? '',
      row.valor ?? row.valorDespesa ?? '',
      row.vencimento ?? row.dataVencimento?.toISOString?.() ?? '',
      row.status ?? '',
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(','),
  )
  return [header.join(','), ...body].join('\n')
})
