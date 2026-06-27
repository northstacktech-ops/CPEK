// CPEK — validators de Saídas (ARCHITECTURE §8, §5, §6).
import { z } from 'zod'
import { uuid, money } from './common'

export const listExitsQuery = z.object({
  companyId: uuid,
  periodId: uuid.optional(),
  page: z.coerce.number().int().min(1).default(1),
})

export const createExitBody = z.object({
  companyId: uuid,
  periodId: uuid,
  bankAccountId: uuid.optional(),
  contactId: uuid.optional(),
  costCenterId: uuid.optional(),
  categoryId: uuid.optional(),
  paymentId: uuid.optional(),
  valorDespesa: money,
  descricao: z.string().max(2000).optional(),
  dataLancamento: z.coerce.date().optional(),
  dataVencimento: z.coerce.date().optional(),
  dataPagamento: z.coerce.date().optional(),
  documentoNf: z.string().max(60).optional(),
  anotacoes: z.string().max(2000).optional(),
  custom: z.record(z.string(), z.unknown()).optional(),
})

export const updateExitBody = createExitBody.partial().omit({ companyId: true, periodId: true })
