// CPEK — validators de Campos custom (ARCHITECTURE §6, §8).
import { z } from 'zod'
import { uuid } from './common'

export const listCustomFieldsQuery = z.object({
  companyId: uuid,
  kind: z.enum(['ENTRY', 'EXIT', 'CLOSING']).optional(),
})

export const createCustomFieldBody = z.object({
  companyId: uuid,
  kind: z.enum(['ENTRY', 'EXIT', 'CLOSING']),
  fieldKey: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z][a-z0-9_]*$/, 'fieldKey: snake_case minúsculo'),
  label: z.string().min(1).max(120),
  dataType: z.enum(['TEXT', 'NUMBER', 'CURRENCY', 'DATE', 'SELECT']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // para SELECT
  order: z.number().int().default(0),
})

// Editar definição PROPAGA ao histórico (§6) → exige confirmação na UI + audit.
export const updateCustomFieldBody = z.object({
  label: z.string().min(1).max(120).optional(),
  dataType: z.enum(['TEXT', 'NUMBER', 'CURRENCY', 'DATE', 'SELECT']).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
  confirm: z.literal(true), // confirmação obrigatória (§6.4)
})
