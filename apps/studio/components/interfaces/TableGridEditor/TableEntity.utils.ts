import { Lint } from '../../../data/lint/lint-query'

export const getEntityLintDetails = (
  entityName: string,
  lintName: string,
  lintLevels: ('ERROR' | 'WARN')[],
  lints: Lint[],
  schema: string
): { hasLint: boolean; count: number; matchingLint: Lint | null } => {
  const matchingLint =
    lints?.find(
      (lint) =>
        lint?.metadata?.name === entityName &&
        lint?.metadata?.schema === schema &&
        lint?.name === lintName &&
        lintLevels.includes(lint?.level as 'ERROR' | 'WARN')
    ) || null

  return {
    hasLint: matchingLint !== null,
    count: matchingLint ? 1 : 0,
    matchingLint,
  }
}

export const formatTableRowsToSQL = (table: string, rows: any[]) => {
  return rows
    .map((row) => {
      const filteredRow = { ...row }
      if ('idx' in filteredRow) delete filteredRow.idx

      const columns = Object.keys(filteredRow)
        .map((col) => `"${col}"`)
        .join(', ')
      const values = Object.values(filteredRow)
        .map((val) => (typeof val === 'object' && val !== null ? JSON.stringify(val) : val))
        .map((val) => `'${val}'`)
        .join(', ')
      return `INSERT INTO ${table} (${columns}) VALUES (${values});`
    })
    .join('\n')
}
