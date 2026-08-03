// CPEK — validators de Catálogos (forma de pagamento, serviço, status, categoria).
// ARCHITECTURE §5, §8. CATEGORY carrega dreGroup (§7).
import { z } from 'zod'
import { boolQuery, uuid } from './common'

export const catalogKind = z.enum(['PAYMENT_METHOD', 'SERVICE', 'STATUS', 'CATEGORY'])
export const dreGroup = z.enum([
  'OPERATING_REVENUE',
  'OPERATING_COST',
  'OPERATING_EXPENSE',
  'OTHER_REVENUE',
  'INVESTING',
  'FINANCING',
])

export const listCatalogsQuery = z.object({
  companyId: uuid,
  kind: catalogKind.optional(),
  includeInactive: boolQuery,
})

export const createCatalogBody = z
  .object({
    companyId: uuid,
    kind: catalogKind,
    label: z.string().min(1).max(120),
    order: z.number().int().default(0),
    dreGroup: dreGroup.optional(),
    excludeFromDashboard: z.boolean().optional(),
  })
  // dreGroup só faz sentido para CATEGORY (§5.1).
  .refine((v) => v.kind === 'CATEGORY' || v.dreGroup == null, {
    message: 'dreGroup só é válido para kind=CATEGORY',
    path: ['dreGroup'],
  })
  // excludeFromDashboard só faz sentido para STATUS (ex.: "Consolidado").
  .refine((v) => v.kind === 'STATUS' || v.excludeFromDashboard == null, {
    message: 'excludeFromDashboard só é válido para kind=STATUS',
    path: ['excludeFromDashboard'],
  })

export const updateCatalogBody = z.object({
  label: z.string().min(1).max(120).optional(),
  order: z.number().int().optional(),
  dreGroup: dreGroup.optional(),
  excludeFromDashboard: z.boolean().optional(),
  active: z.boolean().optional(),
})
