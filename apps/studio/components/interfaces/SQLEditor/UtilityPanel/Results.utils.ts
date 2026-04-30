import { markdownTable } from 'markdown-table'
import Papa from 'papaparse'

type ResultRow = Record<string, unknown>

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

export function formatResults(
  results: ResultRow[]
): Record<string, string | number | boolean | null | undefined>[] {
  return results.map((row) => {
    const formatted: Record<string, string | number | boolean> = {}
    for (const key of Object.keys(row)) {
      const value = row[key]
      formatted[key] =
        typeof value === 'object' ? JSON.stringify(value) : (value as string | number | boolean)
    }
    return formatted
  })
}

export function convertResultsToMarkdown(results: ResultRow[]): string | undefined {
  const formatted = formatResults(results)
  if (formatted.length === 0) return undefined

  const columns = Object.keys(formatted[0])
  const rows = formatted.map((row) => columns.map((col) => String(row[col] ?? '')))
  const table = [columns, ...rows]
  return markdownTable(table)
}

export function convertResultsToJSON(results: ResultRow[]): string | undefined {
  if (results.length === 0) return undefined
  return JSON.stringify(results, null, 2)
}

export function getResultsHeaders(results: ResultRow[]): string[] | undefined {
  const firstRow = Array.from(results)[0]
  if (firstRow) return Object.keys(firstRow)
  return undefined
}

export function convertResultsToCSV(results: ResultRow[]): string | undefined {
  if (results.length === 0) return undefined

  const headers = getResultsHeaders(results)
  const formatted = formatResults(results)

  return Papa.unparse(formatted, { columns: headers })
}
