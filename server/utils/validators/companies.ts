// CPEK — validators de Empresas (ARCHITECTURE §8, §13).
import { z } from 'zod'

export const createCompanyBody = z.object({
  name: z.string().min(1).max(160),
  segment: z.string().max(120).optional(),
  // Template de franquia aplicado na criação (§13). Default: supervisao.
  template: z.string().default('supervisao'),
})
