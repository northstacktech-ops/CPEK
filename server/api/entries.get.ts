import type { Prisma } from '@prisma/client'
import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listEntriesQuery } from '../utils/validators/entries'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listEntriesQuery)

  return withTenant(auth.tenantId, async (tx) => {
    const where: Prisma.EntryWhereInput = {
      companyId: query.companyId,
      ...(query.periodId ? { periodId: query.periodId } : {}),
      ...(query.statusId ? { statusId: query.statusId } : {}),
      ...(query.notaFiscal ? { notaFiscal: query.notaFiscal === 'true' } : {}),
      ...(query.from || query.to
        ? { dataServico: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
        : {}),
    }

    // Busca livre: resolve cliente/serviço por nome/label e combina com os campos
    // de texto do próprio lançamento — pesquisa em toda a empresa, não só na
    // página carregada (regra crítica: nenhum lançamento pode ficar "escondido").
    if (query.q) {
      const q = query.q
      const [contacts, services] = await Promise.all([
        tx.contact.findMany({ where: { companyId: query.companyId, type: 'CLIENT', name: { contains: q, mode: 'insensitive' } }, select: { id: true } }),
        tx.catalogValue.findMany({ where: { companyId: query.companyId, kind: 'SERVICE', label: { contains: q, mode: 'insensitive' } }, select: { id: true } }),
      ])
      where.OR = [
        { placa: { contains: q, mode: 'insensitive' } },
        { modelo: { contains: q, mode: 'insensitive' } },
        { documentoNf: { contains: q, mode: 'insensitive' } },
        { anotacoes: { contains: q, mode: 'insensitive' } },
        ...(contacts.length ? [{ contactId: { in: contacts.map((c) => c.id) } }] : []),
        ...(services.length ? [{ serviceId: { in: services.map((s) => s.id) } }] : []),
      ]
    }

    const [items, total] = await Promise.all([
      tx.entry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      tx.entry.count({ where }),
    ])
    return { items, page: query.page, pageSize: query.pageSize, total }
  })
})
