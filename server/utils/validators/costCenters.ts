// CPEK — validators de Centros de Custo (ARCHITECTURE §5, §8).
import { z } from 'zod'
import { uuid } from './common'

export const listCostCentersQuery = z.object({ companyId: uuid })

export const createCostCenterBody = z.object({
  companyId: uuid,
  label: z.string().min(1).max(120),
  costType: z.enum(['FIXED', 'VARIABLE']),
})

export const updateCostCenterBody = createCostCenterBody
  .partial()
  .omit({ companyId: true })
  .extend({ active: z.boolean().optional() })
