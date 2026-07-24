// CPEK — resolução automática de período a partir da data do lançamento.
// Um lançamento sempre pertence ao período (mês/ano) da sua própria data de
// competência; o período é criado automaticamente se ainda não existir.
// Data futura é bloqueada: só se lança retroativo ou no dia corrente.
import type { Prisma } from '@prisma/client'
import { futureDateError } from './http'

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export async function resolvePeriod(
  tx: Prisma.TransactionClient,
  tenantId: string,
  companyId: string,
  date: Date | undefined,
) {
  const ref = date ?? new Date()
  if (startOfDay(ref) > startOfDay(new Date())) throw futureDateError()

  const month = ref.getMonth() + 1
  const year = ref.getFullYear()
  const period = await tx.period.upsert({
    where: { companyId_year_month: { companyId, year, month } },
    update: {},
    create: { tenantId, companyId, year, month },
  })
  return period
}
