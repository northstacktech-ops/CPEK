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
  // Catálogos (SERVICE/STATUS/PAYMENT_METHOD/CATEGORY) — idempotente por (companyId, kind, label).
  for (const [kind, values] of Object.entries(template.catalogs) as Array<
    [CatalogKind, Array<{ label: string; order?: number; dreGroup?: DreGroup }>]
  >) {
    for (const v of values) {
      const exists = await tx.catalogValue.findFirst({ where: { companyId, kind, label: v.label } })
      if (!exists) {
        await tx.catalogValue.create({
          data: { tenantId, companyId, kind, label: v.label, order: v.order ?? 0, dreGroup: v.dreGroup ?? null },
        })
      }
    }
  }

  // Centros de custo — idempotente por (companyId, label).
  for (const cc of template.costCenters) {
    const exists = await tx.costCenter.findFirst({ where: { companyId, label: cc.label } })
    if (!exists) {
      await tx.costCenter.create({
        data: { tenantId, companyId, label: cc.label, costType: cc.costType },
      })
    }
  }

  // Campos custom — idempotente via unique (companyId, kind, fieldKey).
  for (const [kind, fields] of Object.entries(template.customFields ?? {}) as Array<
    [EntryKind, Array<{ fieldKey: string; label: string; dataType: FieldType; required?: boolean; order?: number }>]
  >) {
    for (const f of fields) {
      await tx.customField.upsert({
        where: { companyId_kind_fieldKey: { companyId, kind, fieldKey: f.fieldKey } },
        update: { label: f.label, dataType: f.dataType, required: f.required ?? false, order: f.order ?? 0 },
        create: {
          tenantId,
          companyId,
          kind,
          fieldKey: f.fieldKey,
          label: f.label,
          dataType: f.dataType,
          required: f.required ?? false,
          order: f.order ?? 0,
        },
      })
    }
  }
}
