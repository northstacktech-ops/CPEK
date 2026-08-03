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
  periodId: uuid.optional(), // derivado automaticamente de dataLancamento (server/utils/period.ts)
  // .nullable() além de .optional(): permite o cliente limpar o campo (envia null)
  // em vez de omiti-lo — omitir significa "não mexer", null significa "apagar".
  contactId: uuid.nullable().optional(),
  costCenterId: uuid.nullable().optional(),
  categoryId: uuid.nullable().optional(),
  paymentId: uuid.nullable().optional(),
  statusId: uuid.nullable().optional(),
  valorDespesa: money,
  descricao: z.string().max(2000).nullable().optional(),
  dataLancamento: z.coerce.date().optional(),
  dataVencimento: z.coerce.date().nullable().optional(),
  dataPagamento: z.coerce.date().nullable().optional(),
  documentoNf: z.string().max(60).nullable().optional(),
  anotacoes: z.string().max(2000).nullable().optional(),
  custom: z.record(z.string(), z.unknown()).optional(),
})

export const updateExitBody = createExitBody.partial().omit({ companyId: true, periodId: true })
