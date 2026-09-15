import Papa from 'papaparse'

import type { SupaTable } from '@/components/grid/types'
import { isValueTruncated } from '@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'
import { getCellValue } from '@/data/table-rows/get-cell-value-mutation'
import type { RoleImpersonationState } from '@/lib/role-impersonation'

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
  roleImpersonationState,
}: {
  rows: Record<string, unknown>[]
  table: SupaTable
  projectRef: string
  connectionString: string | null
  roleImpersonationState?: RoleImpersonationState
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
          roleImpersonationState,
        })
      })
    )
  } catch (error: unknown) {
    return { status: 'fetch_error', error }
  }

  return { status: 'ok', rows: hydrated }
}
