import Papa from 'papaparse'

import type { SupaTable } from '@/components/grid/types'
import { isValueTruncated } from '@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'
import { formatTableRowsToSQL } from '@/components/interfaces/TableGridEditor/TableEntity.utils'
import { getCellValue } from '@/data/table-rows/get-cell-value-mutation'

export type CopyRowsFormat = 'csv' | 'json' | 'sql'

export const formatRowsForCSV = ({ rows, columns }: { rows: any[]; columns: string[] }) => {
  const formattedRows = rows.map((row) => {
    const formattedRow = row
    Object.keys(row).map((column) => {
      if (typeof row[column] === 'object' && row[column] !== null)
        formattedRow[column] = JSON.stringify(formattedRow[column])
    })
    return formattedRow
  })
  const csv = Papa.unparse(formattedRows, { columns })
  return csv
}

export type HydrateTruncatedRowsResult =
  | { status: 'ok'; rows: Record<string, unknown>[] }
  | { status: 'no_primary_key' }
  | { status: 'fetch_error'; error: unknown }

/**
 * For each cell whose value was truncated for display (see isValueTruncated),
 * refetch the full value via getCellValue and return a new array with the
 * truncated cells replaced. If any row has a truncated cell but the table has
 * no primary key, returns { status: 'no_primary_key' } so the caller can
 * surface a clear error instead of silently exporting truncated data.
 */
export const hydrateTruncatedRows = async ({
  rows,
  table,
  projectRef,
  connectionString,
}: {
  rows: Record<string, unknown>[]
  table: SupaTable
  projectRef: string
  connectionString: string | null
}): Promise<HydrateTruncatedRowsResult> => {
  const jobs: { rowIdx: number; column: string }[] = []
  rows.forEach((row, rowIdx) => {
    Object.keys(row).forEach((column) => {
      const value = row[column]
      if (typeof value === 'string' && isValueTruncated(value)) {
        jobs.push({ rowIdx, column })
      }
    })
  })

  if (jobs.length === 0) return { status: 'ok', rows }

  if (!table.primaryKey || table.primaryKey.length === 0) {
    return { status: 'no_primary_key' }
  }

  const pkColumns = table.primaryKey
  const hydrated = rows.map((row) => ({ ...row }))

  try {
    await Promise.all(
      jobs.map(async ({ rowIdx, column }) => {
        const sourceRow = rows[rowIdx]
        const pkMatch = pkColumns.reduce<Record<string, unknown>>(
          (acc, pk) => ({ ...acc, [pk]: sourceRow[pk] }),
          {}
        )
        hydrated[rowIdx][column] = await getCellValue({
          projectRef,
          connectionString,
          table: { schema: table.schema ?? 'public', name: table.name },
          column,
          pkMatch,
        })
      })
    )
  } catch (error: unknown) {
    return { status: 'fetch_error', error }
  }

  return { status: 'ok', rows: hydrated }
}


export const hasTruncatedCellValues = (rows: Record<string, unknown>[]) =>
  rows.some((row) =>
    Object.values(row).some((value) => typeof value === 'string' && isValueTruncated(value))
  )

/**
 * Hydrates truncated cell values and serializes the rows to the requested
 * format. Throws if hydration fails so the caller can surface an error in the
 * surrounding async flow (e.g. copyToClipboard).
 */
export const formatRowsForCopy = async ({
  rows,
  table,
  format,
  projectRef,
  connectionString,
}: {
  rows: Record<string, unknown>[]
  table: SupaTable
  format: CopyRowsFormat
  projectRef: string
  connectionString: string | null
}): Promise<string> => {
  const hydrated = await hydrateTruncatedRows({ rows, table, projectRef, connectionString })
  if (hydrated.status !== 'ok') {
    throw new Error('Failed to fetch full values for truncated cells')
  }
  const hydratedRows = hydrated.rows
  if (format === 'csv') {
    return formatRowsForCSV({
      rows: hydratedRows,
      columns: table.columns.map((column) => column.name),
    })
  } else if (format === 'sql') {
    return formatTableRowsToSQL(table, hydratedRows)
  } else {
    return JSON.stringify(hydratedRows)
  }
}
