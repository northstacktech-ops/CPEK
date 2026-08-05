import type { Prisma } from '@prisma/client'
import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listExitsQuery } from '../utils/validators/exits'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listExitsQuery)

  return withTenant(auth.tenantId, async (tx) => {
    const where: Prisma.ExitWhereInput = {
      companyId: query.companyId,
      ...(query.periodId ? { periodId: query.periodId } : {}),
      ...(query.statusId ? { statusId: query.statusId } : {}),
      ...(query.costCenterId ? { costCenterId: query.costCenterId } : {}),
      ...(query.notaFiscal ? { documentoNf: query.notaFiscal === 'true' ? { not: null } : null } : {}),
      ...(query.from || query.to
        ? { dataLancamento: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
        : {}),
    }

    // Busca livre: resolve fornecedor/categoria por nome/label e combina com os
    // campos de texto do próprio lançamento — pesquisa em toda a empresa, não só
    // na página carregada.
    if (query.q) {
      const q = query.q
      const [contacts, categories] = await Promise.all([
        tx.contact.findMany({ where: { companyId: query.companyId, type: 'SUPPLIER', name: { contains: q, mode: 'insensitive' } }, select: { id: true } }),
        tx.catalogValue.findMany({ where: { companyId: query.companyId, kind: 'CATEGORY', label: { contains: q, mode: 'insensitive' } }, select: { id: true } }),
      ])
      where.OR = [
        { documentoNf: { contains: q, mode: 'insensitive' } },
        { descricao: { contains: q, mode: 'insensitive' } },
        { anotacoes: { contains: q, mode: 'insensitive' } },
        ...(contacts.length ? [{ contactId: { in: contacts.map((c) => c.id) } }] : []),
        ...(categories.length ? [{ categoryId: { in: categories.map((c) => c.id) } }] : []),
      ]
    }

    const [items, total] = await Promise.all([
      tx.exit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      tx.exit.count({ where }),
    ])
    return { items, page: query.page, pageSize: query.pageSize, total }
  })
})
