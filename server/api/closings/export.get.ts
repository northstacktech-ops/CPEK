import { toCsv } from '../../utils/csv'
import { requireAuth, validateQuery } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { listClosingsQuery } from '../../utils/validators/closings'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listClosingsQuery)

  const csv = await withTenant(auth.tenantId, async (tx) => {
    const where = { companyId: query.companyId, ...(query.periodId ? { periodId: query.periodId } : {}) }
    const [rows, contacts, statuses] = await Promise.all([
      tx.closing.findMany({ where, orderBy: { createdAt: 'desc' } }),
      tx.contact.findMany({ where: { companyId: query.companyId }, select: { id: true, name: true } }),
      tx.catalogValue.findMany({ where: { companyId: query.companyId, kind: 'STATUS' }, select: { id: true, label: true } }),
    ])

    const contactLabel = new Map(contacts.map((c) => [c.id, c.name]))
    const statusLabel = new Map(statuses.map((s) => [s.id, s.label]))

    const columns = ['id', 'cliente', 'valor', 'vencimento', 'recebimento', 'status']
    return toCsv(
      rows.map((row) => ({
        id: row.id,
        cliente: (row.contactId && contactLabel.get(row.contactId)) ?? '',
        valor: row.valorFechamento.toString(),
        vencimento: row.dataVencPrev?.toISOString() ?? '',
        recebimento: row.dataRecebimento?.toISOString() ?? '',
        status: (row.statusId && statusLabel.get(row.statusId)) ?? '',
      })),
      columns,
    )
  })

  setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'content-disposition', 'attachment; filename="fechamentos.csv"')
  return csv
})
