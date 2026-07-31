import { writeAudit } from '../../utils/audit'
import { apiError, requireAuth } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')

  return withTenant(auth.tenantId, async (tx) => {
    const current = await tx.feeProfile.findUnique({ where: { id } })
    if (!current) throw apiError(404, 'NOT_FOUND', 'Perfil de taxa não encontrado')

    const usageCount = await tx.entry.count({ where: { feeProfileId: id } })
    if (usageCount > 0) {
      throw apiError(409, 'FEE_PROFILE_IN_USE', 'Este perfil de taxa já foi usado em lançamentos. Use "Bloquear" em vez de apagar.')
    }

    await tx.feeProfile.delete({ where: { id } })
    await writeAudit(tx, { tenantId: auth.tenantId, userId: auth.userId, action: 'FEE_PROFILE_DELETE', entity: 'FeeProfile', entityId: id })
    return { ok: true }
  })
})
