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
  if (rows.length === 0) return ''

  const firstRow = rows[0]
  const columns = Object.keys(firstRow)
    .filter((col) => col !== 'idx')
    .map((col) => `"${col}"`)
    .join(', ')

  const valuesSets = rows
    .map((row) => {
      const filteredRow = { ...row }
      if ('idx' in filteredRow) delete filteredRow.idx

      return (
        '(' +
        Object.values(filteredRow)
          .map((val) =>
            typeof val === 'object' && val !== null ? JSON.stringify(val) : `'${val}'`
          )
          .join(', ') +
        ')'
      )
    })
    .join(', ')

  return `INSERT INTO ${table} (${columns}) VALUES ${valuesSets};`
}
