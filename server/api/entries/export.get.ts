import { toCsv } from '../../utils/csv'
import { requireAuth, validateQuery } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { listEntriesQuery } from '../../utils/validators/entries'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listEntriesQuery)

  const csv = await withTenant(auth.tenantId, async (tx) => {
    const where = { companyId: query.companyId, ...(query.periodId ? { periodId: query.periodId } : {}) }
    const [rows, contacts, services, statuses] = await Promise.all([
      tx.entry.findMany({ where, orderBy: { createdAt: 'desc' } }),
      tx.contact.findMany({ where: { companyId: query.companyId }, select: { id: true, name: true } }),
      tx.catalogValue.findMany({ where: { companyId: query.companyId, kind: 'SERVICE' }, select: { id: true, label: true } }),
      tx.catalogValue.findMany({ where: { companyId: query.companyId, kind: 'STATUS' }, select: { id: true, label: true } }),
    ])

    const contactLabel = new Map(contacts.map((c) => [c.id, c.name]))
    const serviceLabel = new Map(services.map((s) => [s.id, s.label]))
    const statusLabel = new Map(statuses.map((s) => [s.id, s.label]))

    const columns = ['id', 'data', 'cliente', 'servico', 'valor', 'deslocamento', 'pesquisa', 'retorno', 'notaFiscal', 'placa', 'modelo', 'documentoNf', 'status']
    return toCsv(
      rows.map((row) => ({
        id: row.id,
        data: row.dataServico?.toISOString() ?? '',
        cliente: (row.contactId && contactLabel.get(row.contactId)) ?? '',
        servico: (row.serviceId && serviceLabel.get(row.serviceId)) ?? '',
        valor: row.valorServico.toString(),
        deslocamento: row.deslocamento.toString(),
        pesquisa: row.pesquisa?.toString() ?? '',
        retorno: row.retorno?.toString() ?? '',
        notaFiscal: row.notaFiscal ? 'Sim' : 'Não',
        placa: row.placa ?? '',
        modelo: row.modelo ?? '',
        documentoNf: row.documentoNf ?? '',
        status: (row.statusId && statusLabel.get(row.statusId)) ?? '',
      })),
      columns,
    )
  })

  setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'content-disposition', 'attachment; filename="entradas.csv"')
  return csv
})
