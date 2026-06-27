// POST /api/entries — criar entrie (valida fixos+custom, grava snapshot) (§8, §6).
import { requireAuth, validateBody, notImplemented } from '../utils/http'
import { createEntryBody } from '../utils/validators/entries'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  await validateBody(event, createEntryBody)
  // TODO(§6): withTenant → buildCustomSnapshot + tx.entrie.create. Período fechado → 409.
  return notImplemented('§6')
})
