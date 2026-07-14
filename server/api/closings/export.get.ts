import { toCsv } from '../../utils/csv'
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
  const columns = ['id', 'cliente', 'valor', 'vencimento', 'recebimento', 'status']
  return toCsv(
    rows.map((row: any) => ({
      id: row.id,
      cliente: row.cliente ?? row.contactId ?? '',
      valor: row.valor ?? row.valorFechamento ?? '',
      vencimento: row.vencimento ?? row.dataVencPrev?.toISOString?.() ?? '',
      recebimento: row.recebimento ?? row.dataRecebimento?.toISOString?.() ?? '',
      status: row.status ?? row.statusId ?? '',
    })),
    columns,
  )
})
