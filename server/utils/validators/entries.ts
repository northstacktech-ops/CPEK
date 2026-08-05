// CPEK — validators de Entradas (ARCHITECTURE §8, §5, §6).
import { z } from 'zod'
import { uuid, money } from './common'

export const listEntriesQuery = z.object({
  companyId: uuid,
  periodId: uuid.optional(),
  statusId: uuid.optional(),
  // Busca livre (cliente, serviço, placa, modelo, documento NF, descrição) — resolvida no servidor.
  q: z.string().trim().min(1).max(120).optional(),
  notaFiscal: z.enum(['true', 'false']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

export const createEntryBody = z.object({
  companyId: uuid,
  periodId: uuid.optional(), // derivado automaticamente de dataServico (server/utils/period.ts)
  // .nullable() além de .optional(): permite o cliente limpar o campo (envia null)
  // em vez de omiti-lo — omitir significa "não mexer", null significa "apagar".
  contactId: uuid.nullable().optional(),
  serviceId: uuid.nullable().optional(),
  categoryId: uuid.nullable().optional(),
  paymentId: uuid.nullable().optional(),
  statusId: uuid.nullable().optional(),
  feeProfileId: uuid.nullable().optional(),
  valorServico: money,
  deslocamento: money.default(0),
  pesquisa: money.nullable().optional(),
  retorno: money.nullable().optional(),
  notaFiscal: z.boolean().optional(),
  placa: z.string().max(16).nullable().optional(),
  modelo: z.string().max(120).nullable().optional(),
  dataServico: z.coerce.date().optional(),
  dataPagamento: z.coerce.date().nullable().optional(),
  documentoNf: z.string().max(60).nullable().optional(),
  anotacoes: z.string().max(2000).nullable().optional(),
  // Campos custom dinâmicos (§6): { fieldKey: value }. Validados no servidor.
  custom: z.record(z.string(), z.unknown()).optional(),
})

export const updateEntryBody = createEntryBody.partial().omit({ companyId: true, periodId: true })
