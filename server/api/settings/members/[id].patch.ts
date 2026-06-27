// PATCH /api/settings/members/:id — papel/ativação de membro (admin) (ARCHITECTURE §8, §9).
import { requireAdmin, validateBody, notImplemented } from '../../../utils/http'
import { updateMemberBody } from '../../../utils/validators/members'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const _id = getRouterParam(event, 'id')
  await validateBody(event, updateMemberBody)
  // TODO(§9): atualizar role/active + setUserClaims; writeAudit('MEMBER_UPDATE').
  void _id
  return notImplemented('§9')
})
