// CPEK — validators de Empresas (ARCHITECTURE §8, §13).
import { z } from 'zod'

export const createCompanyBody = z.object({
  name: z.string().min(1).max(160),
  segment: z.string().max(120).optional(),
  // Template de franquia aplicado na criação (§13). Default: supervisao.
  template: z.string().default('supervisao'),
})

export const updateCompanyBody = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(160),
  segment: z.string().max(120).nullable().optional(),
  active: z.boolean().optional(),
  legalName: z.string().max(200).nullable().optional(),
  taxId: z.string().max(24).nullable().optional(),
  responsible: z.string().max(160).nullable().optional(),
  email: z.string().email().max(200).nullable().optional().or(z.literal('')),
  phone: z.string().max(40).nullable().optional(),
  whatsapp: z.string().max(40).nullable().optional(),
  zipCode: z.string().max(12).nullable().optional(),
  address: z.string().max(240).nullable().optional(),
  number: z.string().max(20).nullable().optional(),
  complement: z.string().max(120).nullable().optional(),
  district: z.string().max(120).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  state: z.string().length(2).nullable().optional().or(z.literal('')),
  municipalRegistration: z.string().max(80).nullable().optional(),
  stateRegistration: z.string().max(80).nullable().optional(),
  businessHours: z.string().max(160).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})
