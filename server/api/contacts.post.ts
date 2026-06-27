// POST /api/contacts — criar contato (ARCHITECTURE §5, §8).
import { requireAuth, validateBody, notImplemented } from '../utils/http'
import { createContactBody } from '../utils/validators/contacts'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  await validateBody(event, createContactBody)
  return notImplemented('§5')
})
