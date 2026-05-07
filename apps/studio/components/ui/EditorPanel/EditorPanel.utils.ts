import type { SqlError } from 'state/editor-panel-state'

export function formatSqlError(error: SqlError): { header: string | undefined; lines: string[] } {
  if (error.formattedError) {
    const lines = error.formattedError.split('\n').filter((l) => l.length > 0)
    return { header: lines[0], lines: lines.slice(1) }
  }
  return { header: undefined, lines: [error.message ?? ''] }
}
