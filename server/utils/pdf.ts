// CPEK — Export PDF do DRE/relatórios via vue-pdf. ESQUELETO (ARCHITECTURE §3, §7).
// TODO(Fase 3): renderizar DreReport em PDF (vue-pdf) server-side.
import type { DreReport } from '../../types/dre'
import { apiError } from './http'

export async function renderDrePdf(_report: DreReport): Promise<Buffer> {
  // TODO(§7): implementar com vue-pdf.
  throw apiError(501, 'PDF_EXPORT_NOT_IMPLEMENTED', 'Exportação em PDF ainda não implementada — use CSV')
}
