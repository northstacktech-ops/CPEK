// GET /api/custom-fields?companyId&kind — definições de campos custom (ARCHITECTURE §6).
import { requireAuth, validateQuery, notImplemented } from '../utils/http'
import { listCustomFieldsQuery } from '../utils/validators/customFields'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  validateQuery(event, listCustomFieldsQuery)
  return notImplemented('§6')
})
