// CPEK — Export CSV server-side (ARCHITECTURE §3, §8).
// Formato compatível com Excel pt-BR: separador ';', BOM UTF-8 (acentuação) e
// quebras CRLF. Sem BOM/';' o Excel brasileiro joga tudo numa coluna só.
export const CSV_BOM = '﻿'

export function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const header = columns.map(csvEscape).join(';')
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(';')).join('\r\n')
  return `${CSV_BOM}${header}\r\n${body}\r\n`
}
