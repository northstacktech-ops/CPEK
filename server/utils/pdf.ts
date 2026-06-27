// CPEK — Export PDF do DRE/relatórios via vue-pdf. ESQUELETO (ARCHITECTURE §3, §7).
// TODO(Fase 3): renderizar DreReport em PDF (vue-pdf) server-side.
import type { DreReport } from '../../types/dre'

export async function renderDrePdf(_report: DreReport): Promise<Buffer> {
  // TODO(§7): implementar com vue-pdf.
  throw createError({ statusCode: 501, statusMessage: 'PDF export não implementado (stub §7)' })
}
