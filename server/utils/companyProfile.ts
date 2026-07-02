import type { Prisma } from '@prisma/client'

export const emptyCompanyProfile = {
  legalName: null,
  taxId: null,
  responsible: null,
  email: null,
  phone: null,
  whatsapp: null,
  zipCode: null,
  address: null,
  number: null,
  complement: null,
  district: null,
  city: null,
  state: null,
  municipalRegistration: null,
  stateRegistration: null,
  businessHours: null,
  notes: null,
  updatedAt: null,
}

export async function hasCompanyProfileColumns(tx: Prisma.TransactionClient): Promise<boolean> {
  const rows = await tx.$queryRaw<Array<{ exists: boolean }>>`
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'company'
        and column_name = 'legal_name'
    ) as "exists"
  `

  return rows[0]?.exists === true
}

export function completeCompany<T extends Record<string, unknown>>(company: T): T & typeof emptyCompanyProfile {
  return { ...emptyCompanyProfile, ...company }
}
