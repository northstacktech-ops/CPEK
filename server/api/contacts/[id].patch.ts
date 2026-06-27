// PATCH /api/contacts/:id — editar/desativar (cadastros: desativar, não excluir) §5.
import { requireAuth, validateBody, notImplemented } from '../../utils/http'
import { updateContactBody } from '../../utils/validators/contacts'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const _id = getRouterParam(event, 'id')
  await validateBody(event, updateContactBody)
  void _id
  return notImplemented('§5')
})
