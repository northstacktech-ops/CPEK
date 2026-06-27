// POST /api/exits — criar exit (valida fixos+custom, grava snapshot) (§8, §6).
import { requireAuth, validateBody, notImplemented } from '../utils/http'
import { createExitBody } from '../utils/validators/exits'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  await validateBody(event, createExitBody)
  // TODO(§6): withTenant → buildCustomSnapshot + tx.exit.create. Período fechado → 409.
  return notImplemented('§6')
})
