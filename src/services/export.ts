function normalizeValue(value: unknown) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function toCSV(items: Record<string, any>[]) {
  if (!items || items.length === 0) return ''
  const keys = Array.from(new Set(items.flatMap((i) => Object.keys(i))))
  const header = keys.join(',')
  const rows = items.map((it) => keys.map((k) => {
    const v = normalizeValue(it[k])
    const s = v.replace(/"/g, '""')
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

export function downloadExcel(filename: string, items: Record<string, any>[]) {
  if (!items || items.length === 0) {
    downloadCSV(filename.replace(/\.xlsx?$/, '.csv'), items)
    return
  }

  const keys = Array.from(new Set(items.flatMap((i) => Object.keys(i))))
  const rows = [keys, ...items.map((item) => keys.map((key) => normalizeValue(item[key])))]
  const xmlRows = rows.map((row) => `    <Row>${row.map((cell) => `<Cell><Data ss:Type="String">${cell.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`).join('')}</Row>`).join('\n')
  const xml = `<?xml version="1.0"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n  <Worksheet ss:Name="Sheet1">\n    <Table>\n${xmlRows}\n    </Table>\n  </Worksheet>\n</Workbook>`
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadPDF(filename: string, items: Record<string, any>[]) {
  const lines = items.length === 0 ? ['No data available'] : [toCSV(items)]
  const content = lines.join('\n')
  const pdfLines = [
    '%PDF-1.3',
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
    '2 0 obj',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    'endobj',
    '3 0 obj',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /ProcSet [/PDF /Text] /Font << /F1 5 0 R >> >> >>',
    'endobj',
    '4 0 obj',
    `<< /Length ${content.length + 70} >>`,
    'stream',
    'BT',
    '/F1 12 Tf',
    '50 740 Td',
    '0 -14 Td',
    content.split('\n').map((line) => `(${line.replace(/([\\()])/g, '\\$1')}) Tj T*`).join('\n'),
    'ET',
    'endstream',
    'endobj',
    '5 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    'endobj',
    'xref',
    '0 6',
    '0000000000 65535 f ',
    '0000000010 00000 n ',
    '0000000060 00000 n ',
    '0000000111 00000 n ',
    '0000000220 00000 n ',
    '0000000327 00000 n ',
    'trailer',
    '<< /Size 6 /Root 1 0 R >>',
    'startxref',
    '400',
    '%%EOF',
  ]
  const blob = new Blob([pdfLines.join('\n')], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default { toCSV, downloadCSV, downloadExcel, downloadPDF }
