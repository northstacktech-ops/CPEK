// ============================================================================
// CPEK — Prisma client base + extension de tenant guard (ARCHITECTURE §4.2, §4.3)
//
// REGRA DURA (§4.3): a instância base `prismaBase`/`prisma` NUNCA toca dado de
// negócio dentro de server/api/**. Lá, todo acesso passa por withTenant().
// O ESLint (eslint-rules/no-base-prisma-in-api.js) bloqueia o import em api/**.
//
// Dois níveis de defesa:
//   Nível 1 — RLS no banco (prisma/rls/policies.sql) lê app.current_tenant.
//   Nível 2 — esta extension injeta tenant_id em create/update e where em reads,
//             como rede de segurança e para erros melhores. RLS é a garantia final.
// ============================================================================
import { AsyncLocalStorage } from 'node:async_hooks'
import { Prisma, PrismaClient } from '@prisma/client'

// Contexto de tenant da requisição. Populado por withTenant() (server/utils/withTenant.ts).
// Permite que a extension saiba o tenant atual sem confiar no corpo da request.
export const tenantStore = new AsyncLocalStorage<{ tenantId: string }>()

export function currentTenantId(): string | undefined {
  return tenantStore.getStore()?.tenantId
}

// Modelos de negócio que carregam a coluna tenant_id (todos exceto account, que
// isola pela própria coluna id). Mantido em sincronia com prisma/schema.prisma.
const TENANT_COLUMN_MODELS = new Set<string>([
  'User',
  'FormPermission',
  'Company',
  'CatalogValue',
  'CostCenter',
  'FeeProfile',
  'BankAccount',
  'Contact',
  'CustomField',
  'Period',
  'Entry',
  'Exit',
  'Closing',
  'AuditLog',
])

const READ_OPS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
])
const WRITE_TENANT_OPS = new Set(['create', 'createMany', 'upsert'])

/**
 * Singleton — evita esgotar conexões em dev (HMR) e em serverless.
 */
const globalForPrisma = globalThis as unknown as { prismaBase?: PrismaClient }

export const prismaBase: PrismaClient =
  globalForPrisma.prismaBase ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaBase = prismaBase

/**
 * Cliente estendido com o tenant guard (defesa em profundidade — §4.3 ponto 3).
 * Usado por withTenant(). A garantia final continua sendo o RLS no banco.
 */
export const prisma = prismaBase.$extends({
  name: 'tenant-guard',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const tenantId = currentTenantId()
        // Fora de withTenant não há tenant: deixa o RLS decidir (fail-closed).
        if (!model || !tenantId || !TENANT_COLUMN_MODELS.has(model)) {
          return query(args)
        }

        const a = (args ?? {}) as Record<string, unknown>

        if (READ_OPS.has(operation)) {
          a.where = { ...(a.where as object), tenantId }
        } else if (WRITE_TENANT_OPS.has(operation)) {
          if (operation === 'createMany') {
            const data = a.data as Record<string, unknown> | Record<string, unknown>[]
            a.data = Array.isArray(data)
              ? data.map((d) => ({ tenantId, ...d }))
              : { tenantId, ...data }
          } else if (operation === 'upsert') {
            a.create = { tenantId, ...(a.create as object) }
            a.where = { ...(a.where as object) }
          } else {
            a.data = { tenantId, ...(a.data as object) }
          }
        } else if (operation === 'updateMany' || operation === 'deleteMany') {
          a.where = { ...(a.where as object), tenantId }
        }

        return query(a as typeof args)
      },
    },
  },
})

export type ExtendedPrismaClient = typeof prisma
export { Prisma }
