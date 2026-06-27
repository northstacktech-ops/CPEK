// CPEK — validators de Períodos (ARCHITECTURE §8).
import { z } from 'zod'
import { uuid } from './common'

export const listPeriodsQuery = z.object({ companyId: uuid })

export const createPeriodBody = z.object({
  companyId: uuid,
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
})

export const closePeriodBody = z.object({ confirm: z.literal(true) })
