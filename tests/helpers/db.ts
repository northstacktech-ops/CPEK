// Helpers para os testes de integração de RLS (ARCHITECTURE §15).
// IMPORTANTE: os testes devem rodar contra um Postgres de TESTE com o schema
// migrado E as policies aplicadas, conectando pelo papel `cpek_app` (submetido
// ao RLS). Defina DATABASE_URL (ou TEST_DATABASE_URL) apontando para esse banco.
// Ver tests/README.md.
import { randomUUID } from 'node:crypto'
import { prismaBase } from '../../server/utils/prisma'
import { withTenant } from '../../server/utils/withTenant'

export { prismaBase, withTenant }

export const TENANT_A = randomUUID()
export const TENANT_B = randomUUID()

/**
 * Semeia, via withTenant, uma conta + um registro em cada entidade de negócio
 * para o tenant informado. Como roda dentro de withTenant, os inserts respeitam
 * o WITH CHECK do RLS (tenant_id = tenant atual) — provando também o caminho de
 * escrita isolado.
 */
export async function seedTenant(tenantId: string) {
  await withTenant(tenantId, async (tx) => {
    await tx.account.create({ data: { id: tenantId, name: `Tenant ${tenantId.slice(0, 8)}` } })

    const company = await tx.company.create({
      data: { tenantId, name: 'Empresa Teste', segment: 'Vistoria Cautelar' },
    })
    const companyId = company.id

    await tx.bankAccount.create({ data: { tenantId, companyId, name: 'Caixa' } })
    await tx.catalogValue.create({
      data: { tenantId, companyId, kind: 'SERVICE', label: 'Cautelar' },
    })
    await tx.costCenter.create({
      data: { tenantId, companyId, label: 'Operacional', costType: 'VARIABLE' },
    })
    await tx.feeProfile.create({
      data: { tenantId, companyId, label: 'Taxa cartão', feeType: 'PERCENTAGE', value: '2.5' },
    })
    await tx.contact.create({ data: { tenantId, companyId, type: 'CLIENT', name: 'Cliente X' } })
    await tx.customField.create({
      data: { tenantId, companyId, kind: 'ENTRY', fieldKey: 'placa', label: 'Placa', dataType: 'TEXT' },
    })
    const period = await tx.period.create({
      data: { tenantId, companyId, month: 1, year: 2026 },
    })
    await tx.entry.create({
      data: { tenantId, companyId, periodId: period.id, valorServico: '100.00' },
    })
    await tx.exit.create({
      data: { tenantId, companyId, periodId: period.id, valorDespesa: '50.00' },
    })
    await tx.closing.create({
      data: { tenantId, companyId, periodId: period.id, valorFechamento: '70.00' },
    })
    await tx.auditLog.create({
      data: { tenantId, action: 'SEED', entity: 'Account', entityId: tenantId },
    })
  })
}

/** Remove tudo que foi semeado (cascade a partir das contas). */
export async function cleanup() {
  // Roda como owner via migrations? Não: usamos withTenant para apagar respeitando RLS.
  for (const t of [TENANT_A, TENANT_B]) {
    await withTenant(t, async (tx) => {
      await tx.account.deleteMany({ where: { id: t } })
    })
  }
}
