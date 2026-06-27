// CPEK — validators do Dashboard (ARCHITECTURE §12).
import { z } from 'zod'
import { uuid } from './common'

export const dashboardQuery = z.object({
  companyId: uuid,
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})
