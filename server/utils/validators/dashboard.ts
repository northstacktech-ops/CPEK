// CPEK — validators do Dashboard (ARCHITECTURE §12).
import { z } from 'zod'
import { uuid } from './common'

export const dashboardQuery = z.object({
  companyId: uuid,
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
})
