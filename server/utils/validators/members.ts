// CPEK — validators de Membros/convites (ARCHITECTURE §8, §9). Admin only.
import { z } from 'zod'
import { uuid } from './common'

export const inviteMemberBody = z.object({
  email: z.string().email(),
  name: z.string().max(160).optional(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
})

export const updateMemberBody = z.object({
  userId: uuid,
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
  active: z.boolean().optional(),
})
