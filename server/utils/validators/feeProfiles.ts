// CPEK — validators de Taxas e Juros (FeeProfile) (ARCHITECTURE §5, §8).
import { z } from 'zod'
import { uuid } from './common'

export const listFeeProfilesQuery = z.object({ companyId: uuid })

export const createFeeProfileBody = z.object({
  companyId: uuid,
  label: z.string().min(1).max(120),
  feeType: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().finite(), // Decimal(14,4): % ou valor fixo
})

export const updateFeeProfileBody = createFeeProfileBody
  .partial()
  .omit({ companyId: true })
  .extend({ active: z.boolean().optional() })
