// ============================================================================
// CPEK — tenant guard de aplicação (ARCHITECTURE §4.2)
//
// Toda query de negócio roda dentro de withTenant(): abre uma transação e seta
// `app.current_tenant` ANTES de qualquer acesso. O RLS (prisma/rls/policies.sql)
// lê essa variável de sessão e isola o tenant. `is_local = true` mantém o escopo
// na transação — seguro com o pooler em transaction mode.
//
// `tenantId` vem SEMPRE do JWT validado no servidor (app_metadata.account_id),
// NUNCA do corpo da requisição (§4.2 / §9).
// ============================================================================
import type { Prisma } from '@prisma/client'
import { prisma, tenantStore } from './prisma'

export function withTenant<T>(
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  // tenantStore: torna o tenant visível para a extension de guard (§4.3 ponto 3).
  // A transação + set_config (abaixo) são o padrão exato da §4.2 e a base do RLS.
  return tenantStore.run({ tenantId }, () =>
    prisma.$transaction(
      async (tx) => {
        // is_local = true → escopo da transação; seguro com pooler em transaction mode
        await tx.$executeRaw`select set_config('app.current_tenant', ${tenantId}, true)`
        return fn(tx as unknown as Prisma.TransactionClient)
      },
      {
        // Default do Prisma é 5s — margem curta para handlers com várias queries em
        // sequência (ex.: aplicar template de franquia). 15s dá folga sem mascarar
        // uma transação genuinamente presa.
        timeout: 15_000,
        // DATABASE_URL roda com connection_limit=1 (§4.4 — uma conexão por instância
        // serverless via pooler Supavisor): é esperado que requisições concorrentes
        // fiquem na fila esperando a única conexão liberar. O default do Prisma pra
        // maxWait é 2s — curto demais aqui, e o request perdedor da fila cai com
        // "Unable to start a transaction in the given time" mesmo sem nada errado.
        maxWait: 10_000,
      },
    ),
  )
}
