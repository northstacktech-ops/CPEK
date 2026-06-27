// CPEK — validators de Contatos (clientes/fornecedores) (ARCHITECTURE §5, §8).
import { z } from 'zod'
import { uuid } from './common'

export const listContactsQuery = z.object({
  companyId: uuid.optional(),
  type: z.enum(['CLIENT', 'SUPPLIER']).optional(),
})

export const createContactBody = z.object({
  companyId: uuid.optional(),
  type: z.enum(['CLIENT', 'SUPPLIER']),
  name: z.string().min(1).max(200),
  address: z.string().max(300).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional(),
  taxId: z.string().max(20).optional(), // CNPJ/CPF
  contact: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
})

// Cadastros: desativar, não excluir (regra crítica 4) → active no patch.
export const updateContactBody = createContactBody.partial().extend({ active: z.boolean().optional() })
