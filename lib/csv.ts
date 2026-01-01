export function csvEscape(value: unknown) {
  const s = value === null || value === undefined ? "" : String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function toCsv(rows: Array<Record<string, unknown>>, columns: string[]) {
  const header = columns.map(csvEscape).join(",")
  const lines = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(","))
  return [header, ...lines].join("\n")
}


