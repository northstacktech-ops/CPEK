import { isDemoAuth } from '../../../utils/demo'
import { writeAudit } from '../../../utils/audit'
import { apiError, requireAdmin, validateBody } from '../../../utils/http'
import { withTenant } from '../../../utils/withTenant'
import { updateMemberBody } from '../../../utils/validators/members'

export default defineEventHandler(async (event) => {
  const auth = requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  const body = await validateBody(event, updateMemberBody)
  if (isDemoAuth(auth)) return { item: { id, ...body } }

  const { userId, ...data } = body
  void userId
  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.user.update({ where: { id }, data })
    await writeAudit(tx, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: 'MEMBER_UPDATE',
      entity: 'User',
      entityId: id,
      meta: data,
    })
    return { item }
  })
})
