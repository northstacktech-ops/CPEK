// CPEK — validators de Fechamentos (boletos/faturas) (ARCHITECTURE §8, §5).
import { z } from 'zod'
import { uuid, money } from './common'

export const listClosingsQuery = z.object({
  companyId: uuid,
  periodId: uuid.optional(),
  statusId: uuid.optional(),
  // Busca livre (cliente, categoria, documento NF, descrição) — resolvida no servidor.
  q: z.string().trim().min(1).max(120).optional(),
  notaFiscal: z.enum(['true', 'false']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

export const createClosingBody = z.object({
  companyId: uuid,
  periodId: uuid.optional(), // derivado automaticamente de dataFechamento (server/utils/period.ts)
  // .nullable() além de .optional(): permite o cliente limpar o campo (envia null)
  // em vez de omiti-lo — omitir significa "não mexer", null significa "apagar".
  contactId: uuid.nullable().optional(),
  categoryId: uuid.nullable().optional(),
  statusId: uuid.nullable().optional(),
  valorFechamento: money,
  descricao: z.string().max(2000).nullable().optional(),
  dataFechamento: z.coerce.date().optional(),
  dataVencPrev: z.coerce.date().nullable().optional(),
  dataRecebimento: z.coerce.date().nullable().optional(),
  documentoNf: z.string().max(60).nullable().optional(),
  custom: z.record(z.string(), z.unknown()).optional(),
})

export const updateClosingBody = createClosingBody.partial().omit({ companyId: true, periodId: true })
