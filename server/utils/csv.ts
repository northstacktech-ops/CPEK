// CPEK — Export CSV server-side (streaming). ESQUELETO (ARCHITECTURE §3, §8).
// Inclui snapshot resolvido + coluna Unidade. TODO(Fase 2/3): implementar streaming.
export function toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = columns.join(';')
  const body = rows.map((r) => columns.map((c) => escape(r[c])).join(';')).join('\n')
  return `${header}\n${body}\n`
}
