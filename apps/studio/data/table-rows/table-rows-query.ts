import { Query } from '@supabase/pg-meta/src/query'
import { getTableRowsSql } from '@supabase/pg-meta/src/query/table-row-query'
import {
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'

import { IS_PLATFORM } from 'common'
import { parseSupaTable } from 'components/grid/SupabaseGrid.utils'
import { Filter, Sort, SupaRow, SupaTable } from 'components/grid/types'
import { prefetchTableEditor } from 'data/table-editor/table-editor-query'
import {
  ROLE_IMPERSONATION_NO_RESULTS,
  RoleImpersonationState,
  wrapWithRoleImpersonation,
} from 'lib/role-impersonation'
import { isRoleImpersonationEnabled } from 'state/role-impersonation-state'
import { ExecuteSqlError, executeSql } from '../sql/execute-sql-query'
import { tableRowKeys } from './keys'
import { THRESHOLD_COUNT } from './table-rows-count-query'
import { formatFilterValue } from './utils'

export interface GetTableRowsArgs {
  table?: SupaTable
  filters?: Filter[]
  sorts?: Sort[]
  limit?: number
  page?: number
  roleImpersonationState?: RoleImpersonationState
}

// return the primary key columns if exists, otherwise return the first column to use as a default sort
const getDefaultOrderByColumns = (table: SupaTable) => {
  const primaryKeyColumns = table.columns.filter((col) => col?.isPrimaryKey).map((col) => col.name)
  if (primaryKeyColumns.length === 0) {
    return [table.columns[0]?.name]
  } else {
    return primaryKeyColumns
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      if (error?.status === 429 && attempt < maxRetries) {
        // Get retry delay from headers or use exponential backoff (1s, then 2s, then 4s)
        const retryAfter = error.headers?.get('retry-after')
        const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, attempt)
        await sleep(delayMs)
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries reached without success')
}

export const getAllTableRowsSql = ({
  table,
  filters = [],
  sorts = [],
}: {
  table: SupaTable
  filters?: Filter[]
  sorts?: Sort[]
}) => {
  const query = new Query()

  const arrayBasedColumns = table.columns
    .filter(
      (column) => (column?.enum ?? []).length > 0 && column.dataType.toLowerCase() === 'array'
    )
    .map((column) => `"${column.name}"::text[]`)

  let queryChains = query
    .from(table.name, table.schema ?? undefined)
    .select(arrayBasedColumns.length > 0 ? `*,${arrayBasedColumns.join(',')}` : '*')

  filters
    .filter((filter) => filter.value && filter.value !== '')
    .forEach((filter) => {
      const value = formatFilterValue(table, filter)
      queryChains = queryChains.filter(filter.column, filter.operator, value)
    })

  // If sorts is empty and table row count is within threshold, use the primary key as the default sort
  if (sorts.length === 0 && table.estimateRowCount <= THRESHOLD_COUNT) {
    const primaryKeys = getDefaultOrderByColumns(table)
    if (primaryKeys.length > 0) {
      primaryKeys.forEach((col) => {
        queryChains = queryChains.order(table.name, col)
      })
    }
  } else {
    sorts.forEach((sort) => {
      queryChains = queryChains.order(sort.table, sort.column, sort.ascending, sort.nullsFirst)
    })
  }

  return queryChains
}

// TODO: fetchAllTableRows is used for CSV export, but since it doesn't actually truncate anything, (compare to getTableRows)
// this is not suitable and will cause crashes on the pg-meta side given big tables
// (either when the number of rows exceeds Blob size or if the columns in the rows are too large).
// We should handle those errors gracefully, maybe adding a hint to the user about how to extract
// the CSV to their machine via a direct command line connection (e.g., pg_dump), which will be much more
// reliable for large data extraction.
export const fetchAllTableRows = async ({
  projectRef,
  connectionString,
  table,
  filters = [],
  sorts = [],
  roleImpersonationState,
  progressCallback,
}: {
  projectRef: string
  connectionString?: string | null
  table: SupaTable
  filters?: Filter[]
  sorts?: Sort[]
  roleImpersonationState?: RoleImpersonationState
  progressCallback?: (value: number) => void
}) => {
  if (IS_PLATFORM && !connectionString) {
    console.error('Connection string is required')
    return []
  }

  const rows: any[] = []
  const queryChains = getAllTableRowsSql({ table, sorts, filters })

  const rowsPerPage = 500
  const THROTTLE_DELAY = 500

  let page = -1
  while (true) {
    page += 1
    const from = page * rowsPerPage
    const to = (page + 1) * rowsPerPage - 1
    const query = wrapWithRoleImpersonation(
      queryChains.range(from, to).toSql(),
      roleImpersonationState
    )

    try {
      const { result } = await executeWithRetry(async () =>
        executeSql({ projectRef, connectionString, sql: query })
      )
      rows.push(...result)
      progressCallback?.(rows.length)

      if (result.length < rowsPerPage) break

      await sleep(THROTTLE_DELAY)
    } catch (error) {
      throw new Error(
        `Error fetching all table rows: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  return rows.filter((row) => row[ROLE_IMPERSONATION_NO_RESULTS] !== 1)
}

export type TableRows = { rows: SupaRow[] }

export type TableRowsVariables = Omit<GetTableRowsArgs, 'table'> & {
  queryClient: QueryClient
  projectRef?: string
  connectionString?: string | null
  tableId?: number
}

export type TableRowsData = TableRows
export type TableRowsError = ExecuteSqlError

export async function getTableRows(
  {
    queryClient,
    projectRef,
    connectionString,
    tableId,
    roleImpersonationState,
    filters,
    sorts,
    limit,
    page,
  }: TableRowsVariables,
  signal?: AbortSignal
) {
  const entity = await prefetchTableEditor(queryClient, {
    projectRef,
    connectionString,
    id: tableId,
  })
  if (!entity) {
    throw new Error('Table not found')
  }

  const table = parseSupaTable(entity)

  const sql = wrapWithRoleImpersonation(
    getTableRowsSql({ table: entity, filters, sorts, limit, page }),
    roleImpersonationState
  )

  try {
    const { result } = await executeSql(
      {
        projectRef,
        connectionString,
        sql,
        queryKey: ['table-rows', table?.id],
        isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
      },
      signal
    )

    const rows = result.map((x: any, index: number) => {
      return { idx: index, ...x }
    }) as SupaRow[]

    return { rows }
  } catch (error) {
    throw new Error(
      `Error fetching table rows: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export const useTableRowsQuery = <TData = TableRowsData>(
  { projectRef, connectionString, tableId, ...args }: Omit<TableRowsVariables, 'queryClient'>,
  { enabled = true, ...options }: UseQueryOptions<TableRowsData, TableRowsError, TData> = {}
) => {
  const queryClient = useQueryClient()
  return useQuery<TableRowsData, TableRowsError, TData>(
    tableRowKeys.tableRows(projectRef, {
      table: { id: tableId },
      ...args,
    }),
    ({ signal }) =>
      getTableRows({ queryClient, projectRef, connectionString, tableId, ...args }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof tableId !== 'undefined',
      ...options,
    }
  )
}

export function prefetchTableRows(
  client: QueryClient,
  { projectRef, connectionString, tableId, ...args }: Omit<TableRowsVariables, 'queryClient'>
) {
  return client.fetchQuery(
    tableRowKeys.tableRows(projectRef, {
      table: { id: tableId },
      ...args,
    }),
    ({ signal }) =>
      getTableRows({ queryClient: client, projectRef, connectionString, tableId, ...args }, signal)
  )
}
