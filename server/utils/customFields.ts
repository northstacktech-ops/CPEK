// ============================================================================
// CPEK — Campos custom: validação + snapshot imutável (ARCHITECTURE §6).
// ESQUELETO da Fase 2.
//
// Regra (§6): add/remove afeta só dados futuros; editar a definição PROPAGA ao
// histórico (resolvido na leitura). O lançamento grava customSnapshot:
//   [{ fieldKey, value, _label, _type }]
// Reports preferem a definição VIVA (por fieldKey); campo removido cai no cache.
// ============================================================================
import type { Prisma, EntryKind } from '@prisma/client'

export interface CustomSnapshotItem {
  fieldKey: string
  value: unknown
  _label: string
  _type: string
}

/**
 * Lê os CustomField ativos de (companyId, kind), valida obrigatórios e monta o
 * snapshot. DEVE rodar dentro de withTenant (recebe o tx).
 * TODO(§6): validar tipos (TEXT/NUMBER/CURRENCY/DATE/SELECT) e options de SELECT;
 *   lançar VALIDATION_ERROR em obrigatório ausente.
 */
export async function buildCustomSnapshot(
  tx: Prisma.TransactionClient,
  companyId: string,
  kind: EntryKind,
  values: Record<string, unknown>,
): Promise<CustomSnapshotItem[]> {
  const fields = await tx.customField.findMany({
    where: { companyId, kind, active: true },
    orderBy: { order: 'asc' },
  })
  return fields.map((f) => ({
    fieldKey: f.fieldKey,
    value: values[f.fieldKey] ?? null,
    _label: f.label,
    _type: f.dataType,
  }))
}

/**
 * Resolve um snapshot para exibição: prefere a definição viva (label/tipo atuais),
 * cai no cache _label/_type para campos removidos. TODO(§6).
 */
export function resolveSnapshot(
  snapshot: CustomSnapshotItem[],
  liveFields: Array<{ fieldKey: string; label: string; dataType: string }>,
): Array<{ fieldKey: string; value: unknown; label: string; type: string }> {
  const live = new Map(liveFields.map((f) => [f.fieldKey, f]))
  return snapshot.map((s) => {
    const def = live.get(s.fieldKey)
    return { fieldKey: s.fieldKey, value: s.value, label: def?.label ?? s._label, type: def?.dataType ?? s._type }
  })
}
