// CPEK — validators do DRE (ARCHITECTURE §7, §8).
import { z } from 'zod'
import { uuid } from './common'

export const dreQuery = z.object({
  companyId: uuid,
  year: z.coerce.number().int().min(2000).max(2100),
  mode: z.enum(['realizado', 'agendado']).default('realizado'),
  // CSV de ids de conta bancária para filtro (§7.1).
  accounts: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').filter(Boolean) : null)),
})

export const dreExportQuery = dreQuery.extend({
  format: z.enum(['pdf', 'csv']).default('pdf'),
})
