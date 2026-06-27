// GET /api/contacts — clientes/fornecedores (ARCHITECTURE §5, §8).
import { requireAuth, validateQuery, notImplemented } from '../utils/http'
import { listContactsQuery } from '../utils/validators/contacts'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  validateQuery(event, listContactsQuery)
  return notImplemented('§5')
})
