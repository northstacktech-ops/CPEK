// CPEK — schemas zod compartilhados (ARCHITECTURE §8). Validação no servidor em
// TODA rota (regra crítica 6). Schemas reaproveitáveis front/back.
import { z } from 'zod'

export const uuid = z.string().uuid()
export const money = z.number().finite() // Decimal(14,2) no banco; nunca Float lá
export const isoDate = z.string().datetime({ offset: true }).or(z.coerce.date())

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

export const companyScopedQuery = z.object({
  companyId: uuid,
})
