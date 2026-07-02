import { randomUUID } from 'node:crypto'
import { isDemoAuth } from '../../utils/demo'
import { writeAudit } from '../../utils/audit'
import { requireAdmin, validateBody } from '../../utils/http'
import { withTenant } from '../../utils/withTenant'
import { inviteMemberBody } from '../../utils/validators/members'

export default defineEventHandler(async (event) => {
  const auth = requireAdmin(event)
  const body = await validateBody(event, inviteMemberBody)
  if (isDemoAuth(auth)) {
    return { item: { id: `demo-member-${Date.now()}`, active: true, ...body }, inviteEmailSent: false }
  }

  return withTenant(auth.tenantId, async (tx) => {
    const item = await tx.user.create({
      data: {
        id: randomUUID(),
        tenantId: auth.tenantId,
        email: body.email,
        name: body.name,
        role: body.role,
        active: true,
      },
    })
    await writeAudit(tx, {
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: 'MEMBER_INVITE',
      entity: 'User',
      entityId: item.id,
      meta: { email: body.email, inviteEmailSent: false },
    })
    return { item, inviteEmailSent: false }
  })
})
