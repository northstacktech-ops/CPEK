// POST /api/closings — criar closing (valida fixos+custom, grava snapshot) (§8, §6).
import { requireAuth, validateBody, notImplemented } from '../utils/http'
import { createClosingBody } from '../utils/validators/closings'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  await validateBody(event, createClosingBody)
  // TODO(§6): withTenant → buildCustomSnapshot + tx.closing.create. Período fechado → 409.
  return notImplemented('§6')
})
