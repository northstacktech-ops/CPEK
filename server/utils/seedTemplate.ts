// ============================================================================
// CPEK — Aplicação idempotente de template de franquia (ARCHITECTURE §13).
//
// Ao criar uma Company, o servidor aplica um template (Serviços, Categorias com
// dreGroup, Status, Formas de pagamento, Centros de custo, Campos custom). Em V2,
// o mesmo mecanismo serve ao onboarding de novos franqueados.
//
// IDEMPOTENTE: re-rodar não duplica (verifica existência por chave natural).
// DEVE rodar dentro de withTenant (recebe o tx) — respeita o RLS.
// ============================================================================
import type { CatalogKind, CostType, DreGroup, EntryKind, FieldType, Prisma } from '@prisma/client'

export interface FranchiseTemplate {
  templateKey: string
  companyName: string
  segment: string
  catalogs: Partial<Record<CatalogKind, Array<{ label: string; order?: number; dreGroup?: DreGroup }>>>
  costCenters: Array<{ label: string; costType: CostType }>
  customFields?: Partial<Record<EntryKind, Array<{ fieldKey: string; label: string; dataType: FieldType; required?: boolean; order?: number }>>>
}

export async function applyTemplate(
  tx: Prisma.TransactionClient,
  tenantId: string,
  companyId: string,
  template: FranchiseTemplate,
): Promise<void> {
  // Um findFirst+create por item (dezenas de round-trips sequenciais no template
  // padrão) estourava o timeout de 5s da transação interativa do Prisma na hora de
  // criar a empresa. Agora: 1 leitura + 1 escrita em lote por entidade — continua
  // idempotente (só cria o que ainda não existe), só que sem N ida-e-voltas ao banco.

  // Catálogos (SERVICE/STATUS/PAYMENT_METHOD/CATEGORY) — idempotente por (companyId, kind, label).
  const catalogRows = (
    Object.entries(template.catalogs) as Array<[CatalogKind, Array<{ label: string; order?: number; dreGroup?: DreGroup }>]>
  ).flatMap(([kind, values]) =>
    values.map((v) => ({ tenantId, companyId, kind, label: v.label, order: v.order ?? 0, dreGroup: v.dreGroup ?? null })),
  )
  if (catalogRows.length) {
    const kinds = [...new Set(catalogRows.map((r) => r.kind))]
    const existing = await tx.catalogValue.findMany({ where: { companyId, kind: { in: kinds } }, select: { kind: true, label: true } })
    const existingKeys = new Set(existing.map((e) => `${e.kind}::${e.label}`))
    const toCreate = catalogRows.filter((r) => !existingKeys.has(`${r.kind}::${r.label}`))
    if (toCreate.length) await tx.catalogValue.createMany({ data: toCreate })
  }

  // Centros de custo — idempotente por (companyId, label).
  if (template.costCenters.length) {
    const existing = await tx.costCenter.findMany({ where: { companyId }, select: { label: true } })
    const existingLabels = new Set(existing.map((e) => e.label))
    const toCreate = template.costCenters
      .filter((cc) => !existingLabels.has(cc.label))
      .map((cc) => ({ tenantId, companyId, label: cc.label, costType: cc.costType }))
    if (toCreate.length) await tx.costCenter.createMany({ data: toCreate })
  }

  // Campos custom — idempotente via unique real (companyId, kind, fieldKey).
  const customFieldRows = (
    Object.entries(template.customFields ?? {}) as Array<
      [EntryKind, Array<{ fieldKey: string; label: string; dataType: FieldType; required?: boolean; order?: number }>]
    >
  ).flatMap(([kind, fields]) =>
    fields.map((f) => ({
      tenantId,
      companyId,
      kind,
      fieldKey: f.fieldKey,
      label: f.label,
      dataType: f.dataType,
      required: f.required ?? false,
      order: f.order ?? 0,
    })),
  )
  if (customFieldRows.length) {
    await tx.customField.createMany({ data: customFieldRows, skipDuplicates: true })
  }
}
