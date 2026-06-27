// CPEK — validators de Fechamentos (boletos/faturas) (ARCHITECTURE §8, §5).
import { z } from 'zod'
import { uuid, money } from './common'

export const listClosingsQuery = z.object({
  companyId: uuid,
  periodId: uuid.optional(),
  page: z.coerce.number().int().min(1).default(1),
})

export const createClosingBody = z.object({
  companyId: uuid,
  periodId: uuid,
  bankAccountId: uuid.optional(),
  contactId: uuid.optional(),
  categoryId: uuid.optional(),
  statusId: uuid.optional(),
  valorFechamento: money,
  descricao: z.string().max(2000).optional(),
  dataFechamento: z.coerce.date().optional(),
  dataVencPrev: z.coerce.date().optional(),
  dataRecebimento: z.coerce.date().optional(),
  documentoNf: z.string().max(60).optional(),
  custom: z.record(z.string(), z.unknown()).optional(),
})

export const updateClosingBody = createClosingBody.partial().omit({ companyId: true, periodId: true })
