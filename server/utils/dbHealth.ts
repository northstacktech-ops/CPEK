import { prismaBase } from './prisma'

export async function checkDatabaseHealth(): Promise<void> {
  await prismaBase.$queryRaw`select 1`
}
