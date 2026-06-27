// PATCH /api/custom-fields/:id — editar definição (PROPAGA ao histórico) (ARCHITECTURE §6).
import { requireAuth, validateBody, notImplemented } from '../../utils/http'
import { updateCustomFieldBody } from '../../utils/validators/customFields'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const _id = getRouterParam(event, 'id')
  await validateBody(event, updateCustomFieldBody) // exige confirm: true
  // TODO(§6): editar label/tipo reflete na leitura do histórico; writeAudit('CUSTOM_FIELD_EDIT').
  void _id
  return notImplemented('§6')
})
