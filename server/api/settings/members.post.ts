// POST /api/settings/members — convidar membro (admin) → grava claims (ARCHITECTURE §9).
import { requireAdmin, validateBody, notImplemented } from '../../utils/http'
import { inviteMemberBody } from '../../utils/validators/members'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  await validateBody(event, inviteMemberBody)
  // TODO(§9): criar usuário Supabase + setUserClaims({ account_id, role }); writeAudit('MEMBER_INVITE').
  return notImplemented('§9')
})
