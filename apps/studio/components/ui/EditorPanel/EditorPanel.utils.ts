import type { SqlError } from '@/state/editor-panel-state'

export function formatSqlError(error: SqlError): { header: string | undefined; lines: string[] } {
  if (error.formattedError) {
    const lines = error.formattedError.split('\n').filter((l) => l.length > 0)
    return { header: lines[0], lines: lines.slice(1) }
  }
  return { header: undefined, lines: [error.message ?? ''] }
}

export function truncateMiddle(str: string, maxLength: number): string {
  if (str.length <= maxLength || maxLength <= 3) {
    return str
  }
  const charsToShow = maxLength - 3
  const frontChars = Math.ceil(charsToShow / 2)
  const backChars = Math.floor(charsToShow / 2)
  return `${str.slice(0, frontChars)}...${str.slice(str.length - backChars)}`
}
