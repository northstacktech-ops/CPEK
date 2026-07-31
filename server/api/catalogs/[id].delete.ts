import { writeAudit } from '../../utils/audit'
import { apiError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.catalogValue.findUnique({ where: { id } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Cadastro não encontrado')

    // Não há FK no banco entre Entry/Exit/Closing e CatalogValue — checar uso
    // manualmente antes de apagar de vez, senão o hard-delete "funciona" mas
    // deixa lançamentos antigos com uma referência quebrada (§4.3/§14).
    const usageCounts = await Promise.all(
      current.kind === 'CATEGORY'
        ? [
            tx.entry.count({ where: { categoryId: id } }),
            tx.exit.count({ where: { categoryId: id } }),
            tx.closing.count({ where: { categoryId: id } }),
          ]
        : current.kind === 'SERVICE'
          ? [tx.entry.count({ where: { serviceId: id } })]
          : current.kind === 'STATUS'
            ? [tx.entry.count({ where: { statusId: id } }), tx.closing.count({ where: { statusId: id } })]
            : [tx.entry.count({ where: { paymentId: id } }), tx.exit.count({ where: { paymentId: id } })], // PAYMENT_METHOD
    )
    if (usageCounts.some((count) => count > 0)) {
      throw apiError(409, 'CATALOG_IN_USE', 'Este cadastro já foi usado em lançamentos. Use "Bloquear" em vez de apagar.')
    }

    await tx.catalogValue.delete({ where: { id } })
    await writeAudit(tx, { tenantId: auth.tenantId, userId: auth.userId, action: 'CATALOG_DELETE', entity: 'CatalogValue', entityId: id })
    return { ok: true }
  })
})
