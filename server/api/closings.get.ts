import type { Prisma } from '@prisma/client'
import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listClosingsQuery } from '../utils/validators/closings'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listClosingsQuery)

  return withTenant(auth.tenantId, async (tx) => {
    const where: Prisma.ClosingWhereInput = {
      companyId: query.companyId,
      ...(query.periodId ? { periodId: query.periodId } : {}),
      ...(query.statusId ? { statusId: query.statusId } : {}),
      ...(query.notaFiscal ? { documentoNf: query.notaFiscal === 'true' ? { not: null } : null } : {}),
      ...(query.from || query.to
        ? { dataFechamento: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
        : {}),
    }

    // Busca livre: resolve cliente/categoria por nome/label e combina com os
    // campos de texto do próprio lançamento — pesquisa em toda a empresa, não só
    // na página carregada.
    if (query.q) {
      const q = query.q
      const [contacts, categories] = await Promise.all([
        tx.contact.findMany({ where: { companyId: query.companyId, type: 'CLIENT', name: { contains: q, mode: 'insensitive' } }, select: { id: true } }),
        tx.catalogValue.findMany({ where: { companyId: query.companyId, kind: 'CATEGORY', label: { contains: q, mode: 'insensitive' } }, select: { id: true } }),
      ])
      where.OR = [
        { documentoNf: { contains: q, mode: 'insensitive' } },
        { descricao: { contains: q, mode: 'insensitive' } },
        ...(contacts.length ? [{ contactId: { in: contacts.map((c) => c.id) } }] : []),
        ...(categories.length ? [{ categoryId: { in: categories.map((c) => c.id) } }] : []),
      ]
    }

    const [items, total] = await Promise.all([
      tx.closing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      tx.closing.count({ where }),
    ])
    return { items, page: query.page, pageSize: query.pageSize, total }
  })
})
