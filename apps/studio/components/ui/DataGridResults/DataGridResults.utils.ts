export type ResultRow = Record<string, unknown>

const ESTIMATED_CHARACTER_WIDTH = 8.25
export const RESULT_COLUMN_MIN_WIDTH = 100
const MAX_COLUMN_WIDTH = 500

export function calculateResultColumnWidth(columnName: string, rows: readonly ResultRow[]) {
  const maxContentLength = rows.reduce(
    (maxLength, row) => Math.max(maxLength, (formatCellValue(row[columnName]) ?? '').length),
    columnName.length
  )

  return Math.min(
    Math.max(maxContentLength * ESTIMATED_CHARACTER_WIDTH, RESULT_COLUMN_MIN_WIDTH),
    MAX_COLUMN_WIDTH
  )
}

export function formatClipboardValue(value: unknown) {
  if (value === null) return ''
  if (typeof value == 'object' || Array.isArray(value)) {
    return JSON.stringify(value)
  }
  return String(value)
}

export function formatCellValue(value: unknown) {
  if (value === null) return 'NULL'
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

const LARGE_VALUE_CHAR_THRESHOLD = 60

export function isLargeValue(value: unknown) {
  if (value === null || value === undefined) return false
  if (typeof value === 'object') return true
  const str = String(value)
  return str.length > LARGE_VALUE_CHAR_THRESHOLD || str.includes('\n')
}
