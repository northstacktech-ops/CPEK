import { toCsv } from '../../utils/csv'
import { requireAuth, validateQuery } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { listExitsQuery } from '../../utils/validators/exits'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listExitsQuery)

  const csv = await withTenant(auth.tenantId, async (tx) => {
    const where = { companyId: query.companyId, ...(query.periodId ? { periodId: query.periodId } : {}) }
    const [rows, contacts, categories, costCenters] = await Promise.all([
      tx.exit.findMany({ where, orderBy: { createdAt: 'desc' } }),
      tx.contact.findMany({ where: { companyId: query.companyId }, select: { id: true, name: true } }),
      tx.catalogValue.findMany({ where: { companyId: query.companyId, kind: 'CATEGORY' }, select: { id: true, label: true } }),
      tx.costCenter.findMany({ where: { companyId: query.companyId }, select: { id: true, label: true } }),
    ])

    const contactLabel = new Map(contacts.map((c) => [c.id, c.name]))
    const categoryLabel = new Map(categories.map((c) => [c.id, c.label]))
    const costCenterLabel = new Map(costCenters.map((c) => [c.id, c.label]))
    const today = new Date()

    const columns = ['id', 'data', 'fornecedor', 'categoria', 'centroCusto', 'valor', 'vencimento', 'status']
    return toCsv(
      rows.map((row) => ({
        id: row.id,
        data: row.dataLancamento?.toISOString() ?? '',
        fornecedor: (row.contactId && contactLabel.get(row.contactId)) ?? '',
        categoria: (row.categoryId && categoryLabel.get(row.categoryId)) ?? '',
        centroCusto: (row.costCenterId && costCenterLabel.get(row.costCenterId)) ?? '',
        valor: row.valorDespesa.toString(),
        vencimento: row.dataVencimento?.toISOString() ?? '',
        status: row.dataPagamento ? 'Pago' : row.dataVencimento && row.dataVencimento < today ? 'Vencido' : 'Em aberto',
      })),
      columns,
    )
  })

  setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'content-disposition', 'attachment; filename="saidas.csv"')
  return csv
})
