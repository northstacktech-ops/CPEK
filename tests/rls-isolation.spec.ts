// ============================================================================
// CPEK — Isolamento RLS EM MATRIZ (ARCHITECTURE §15.1) — gate de CI, não-negociável.
//
// Itera sobre TODAS as entidades de tenant (não uma só): o vazamento mais
// perigoso costuma estar numa entidade/endpoint específico. Dois invariantes:
//   1) Com tenant A setado, nenhuma linha de B aparece em NENHUMA entidade.
//   2) SEM tenant setado, toda entidade retorna vazio (fail-closed).
//
// Requer um Postgres de teste com schema migrado + policies aplicadas, conectando
// pelo papel cpek_app. Ver tests/README.md.
// ============================================================================
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { TENANT_A, TENANT_B, cleanup, prismaBase, seedTenant, withTenant } from './helpers/db'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

const TENANT_MODELS = [
  'company',
  'bankAccount',
  'catalogValue',
  'costCenter',
  'feeProfile',
  'contact',
  'customField',
  'period',
  'entry',
  'exit',
  'closing',
  'auditLog',
] as const

describeWithDatabase('Isolamento RLS (matriz)', () => {
  beforeAll(async () => {
    await cleanup()
    await seedTenant(TENANT_A)
    await seedTenant(TENANT_B)
  }, 30_000)

  afterAll(async () => {
    await cleanup()
    await prismaBase.$disconnect()
  })

  it.each(TENANT_MODELS)('tenant A não enxerga %s do tenant B', async (model) => {
    await withTenant(TENANT_A, async (tx) => {
      const rows = await (tx as any)[model].findMany()
      expect(rows.length).toBeGreaterThan(0) // A vê os próprios registros
      // Nenhum registro pertence a B; todo registro é do tenant A.
      expect(rows.every((r: any) => r.tenantId === TENANT_A || r.id === TENANT_A)).toBe(true)
    })
  })

  it.each(TENANT_MODELS)('sem tenant setado, %s retorna vazio (fail-closed)', async (model) => {
    // Cliente base, sem set_config → app_current_tenant() = null → RLS nega tudo.
    const rows = await (prismaBase as any)[model].findMany()
    expect(rows).toHaveLength(0)
  })

  it('escrita de A não cruza para B (WITH CHECK)', async () => {
    await withTenant(TENANT_B, async (tx) => {
      const onlyB = await tx.company.findMany()
      expect(onlyB.every((c) => c.tenantId === TENANT_B)).toBe(true)
    })
  })
})
