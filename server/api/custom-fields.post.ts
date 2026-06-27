// POST /api/custom-fields — criar campo custom (confirmação + audit) (ARCHITECTURE §6).
import { requireAuth, validateBody, notImplemented } from '../utils/http'
import { createCustomFieldBody } from '../utils/validators/customFields'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  await validateBody(event, createCustomFieldBody)
  // TODO(§6): adicionar afeta só lançamentos futuros; writeAudit('CUSTOM_FIELD_ADD').
  return notImplemented('§6')
})
