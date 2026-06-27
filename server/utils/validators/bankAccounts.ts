// CPEK — validators de Contas bancárias (ARCHITECTURE §5, §12).
import { z } from 'zod'
import { uuid, money } from './common'

export const listBankAccountsQuery = z.object({ companyId: uuid })

export const createBankAccountBody = z.object({
  companyId: uuid,
  name: z.string().min(1).max(120),
  openingBalance: money.default(0),
})

export const updateBankAccountBody = createBankAccountBody
  .partial()
  .omit({ companyId: true })
  .extend({ active: z.boolean().optional() })
