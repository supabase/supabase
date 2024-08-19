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

        // We only check for NULL, array and JSON types, everything else we stringify
        // given that Postgres can implicitly cast the right type based on the column type
        if (val === null) {
          return 'null'
        } else if (dataType === 'ARRAY') {
          return `'${JSON.stringify(val).replace('[', '{').replace(/.$/, '}')}'`
        } else if (format?.includes('json')) {
          return `${JSON.stringify(val).replace(/\\"/g, '"').replace('"', "'").replace(/.$/, "'")}`
        } else {
          return `'${val}'`
        }
      })

      return `(${values.join(', ')})`
    })
    .join(', ')

  return `INSERT INTO "${table.schema}"."${table.name}" (${columns}) VALUES ${valuesSets};`
}
