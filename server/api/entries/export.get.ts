import { toCsv } from '../../utils/csv'
import { requireAuth, validateQuery } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { listEntriesQuery } from '../../utils/validators/entries'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listEntriesQuery)
  const rows = await withTenant(auth.tenantId, (tx) =>
    tx.entry.findMany({
      where: { companyId: query.companyId, ...(query.periodId ? { periodId: query.periodId } : {}) },
      orderBy: { createdAt: 'desc' },
    }),
  )

  setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'content-disposition', 'attachment; filename="entradas.csv"')
  const columns = ['id', 'data', 'cliente', 'servico', 'valor', 'deslocamento', 'pesquisa', 'retorno', 'notaFiscal', 'placa', 'modelo', 'documentoNf', 'status']
  return toCsv(
    rows.map((row: any) => ({
      id: row.id,
      data: row.data ?? row.dataServico?.toISOString?.() ?? '',
      cliente: row.cliente ?? row.contactId ?? '',
      servico: row.servico ?? row.serviceId ?? '',
      valor: row.valor ?? row.valorServico ?? '',
      deslocamento: row.deslocamento ?? '',
      pesquisa: row.pesquisa ?? '',
      retorno: row.retorno ?? '',
      notaFiscal: row.notaFiscal ? 'Sim' : 'Não',
      placa: row.placa ?? '',
      modelo: row.modelo ?? '',
      documentoNf: row.documentoNf ?? '',
      status: row.status ?? row.statusId ?? '',
    })),
    columns,
  )
})
