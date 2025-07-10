import { SupaTable } from 'components/grid/types'
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

export const formatTableRowsToSQL = (table: SupaTable, rows: any[]) => {
  if (rows.length === 0) return ''

  const columns = table.columns.map((col) => `"${col.name}"`).join(', ')
  const valuesSets = rows
    .map((row) => {
      const filteredRow = { ...row }
      if ('idx' in filteredRow) delete filteredRow.idx

      const values = Object.entries(filteredRow).map(([key, val]) => {
        const { dataType, format } = table.columns.find((col) => col.name === key) ?? {}
        if (val === null) {
          return 'null'
        }
        let escapedVal
        if (dataType === 'ARRAY') {
          const arr: any[] = Array.isArray(val) ? val : JSON.parse(val as string)
          if (format?.includes('json')) {
            // The JSON needs to be stringified twice to escape the double quotes
            escapedVal = `{${arr.map((v) => JSON.stringify(JSON.stringify(v))).join(',')}}`
          } else {
            // Just stringifying the array will create issues with the newline \n character (and similar characters)
            escapedVal = `{${arr.map((v) => (typeof v === 'string' ? `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : v)).join(',')}}`
          }
        } else if (format?.includes('json')) {
          escapedVal = typeof val === 'string' ? val : JSON.stringify(val)
        } else {
          escapedVal = `${val}`
        }
        return `'${escapedVal.replace(/'/g, "''")}'`
      })
      return `(${values.join(', ')})`
    })
    .join(', ')
  return `INSERT INTO "${table.schema}"."${table.name}" (${columns}) VALUES ${valuesSets};`
}
