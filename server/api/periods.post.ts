// POST /api/periods — abrir período (mês/ano) (ARCHITECTURE §8).
import { requireAuth, validateBody, notImplemented } from '../utils/http'
import { createPeriodBody } from '../utils/validators/periods'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  await validateBody(event, createPeriodBody)
  return notImplemented('§8')
})
