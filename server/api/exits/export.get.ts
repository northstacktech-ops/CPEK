import { toCsv } from '../../utils/csv'
import { requireAuth, validateQuery } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { listExitsQuery } from '../../utils/validators/exits'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listExitsQuery)
  const rows = await withTenant(auth.tenantId, (tx) =>
    tx.exit.findMany({
      where: { companyId: query.companyId, ...(query.periodId ? { periodId: query.periodId } : {}) },
      orderBy: { createdAt: 'desc' },
    }),
  )

  setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'content-disposition', 'attachment; filename="saidas.csv"')
  const columns = ['id', 'data', 'fornecedor', 'categoria', 'centroCusto', 'valor', 'vencimento', 'status']
  return toCsv(
    rows.map((row: any) => ({
      id: row.id,
      data: row.data ?? row.dataLancamento?.toISOString?.() ?? '',
      fornecedor: row.fornecedor ?? row.contactId ?? '',
      categoria: row.categoria ?? row.categoryId ?? '',
      centroCusto: row.centroCusto ?? row.costCenterId ?? '',
      valor: row.valor ?? row.valorDespesa ?? '',
      vencimento: row.vencimento ?? row.dataVencimento?.toISOString?.() ?? '',
      status: row.status ?? '',
    })),
    columns,
  )
})
