export function toCSV(items: Record<string, any>[]) {
  if (!items || items.length === 0) return ''
  const keys = Array.from(new Set(items.flatMap((i) => Object.keys(i))))
  const header = keys.join(',')
  const rows = items.map((it) => keys.map((k) => {
    const v = it[k]
    if (v === null || v === undefined) return ''
    const s = String(v).replace(/"/g, '""')
    return `"${s}"`
  }).join(','))
  return [header, ...rows].join('\n')
}

export function downloadCSV(filename: string, items: Record<string, any>[]) {
  const csv = toCSV(items)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default { toCSV, downloadCSV }
