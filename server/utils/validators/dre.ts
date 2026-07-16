// CPEK — validators do DRE (ARCHITECTURE §7, §8).
import { z } from 'zod'
import { uuid } from './common'

export const dreQuery = z.object({
  companyId: uuid,
  year: z.coerce.number().int().min(2000).max(2100),
  mode: z.enum(['realizado', 'agendado']).default('realizado'),
})

export const dreExportQuery = dreQuery.extend({
  format: z.enum(['pdf', 'csv']).default('pdf'),
})
