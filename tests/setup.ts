// Roda antes de qualquer teste importar server/utils/prisma.ts (via vitest
// `setupFiles`), para que o singleton do Prisma seja criado já apontando para
// o banco de TESTE — nunca para o DATABASE_URL de dev/produção do .env.local.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
}
if (process.env.TEST_DIRECT_URL) {
  process.env.DIRECT_URL = process.env.TEST_DIRECT_URL
}
