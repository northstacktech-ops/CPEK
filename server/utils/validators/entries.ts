// CPEK — validators de Entradas (ARCHITECTURE §8, §5, §6).
import { z } from 'zod'
import { uuid, money } from './common'

export const listEntriesQuery = z.object({
  companyId: uuid,
  periodId: uuid.optional(),
  page: z.coerce.number().int().min(1).default(1),
})

export const createEntryBody = z.object({
  companyId: uuid,
  periodId: uuid,
  bankAccountId: uuid.optional(),
  contactId: uuid.optional(),
  serviceId: uuid.optional(),
  categoryId: uuid.optional(),
  paymentId: uuid.optional(),
  statusId: uuid.optional(),
  feeProfileId: uuid.optional(),
  valorServico: money,
  deslocamento: money.default(0),
  placa: z.string().max(16).optional(),
  modelo: z.string().max(120).optional(),
  dataServico: z.coerce.date().optional(),
  dataPagamento: z.coerce.date().optional(),
  documentoNf: z.string().max(60).optional(),
  anotacoes: z.string().max(2000).optional(),
  // Campos custom dinâmicos (§6): { fieldKey: value }. Validados no servidor.
  custom: z.record(z.string(), z.unknown()).optional(),
})

export const updateEntryBody = createEntryBody.partial().omit({ companyId: true, periodId: true })
