import { Query, type QueryFilter } from '@supabase/pg-meta/src/query'
import { getTableRowsSql } from '@supabase/pg-meta/src/query/table-row-query'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { IS_PLATFORM } from 'common'
import { parseSupaTable } from 'components/grid/SupabaseGrid.utils'
import { Filter, Sort, SupaRow, SupaTable } from 'components/grid/types'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { prefetchTableEditor } from 'data/table-editor/table-editor-query'
import { isMsSqlForeignTable } from 'data/table-editor/table-editor-types'
import {
  ROLE_IMPERSONATION_NO_RESULTS,
  RoleImpersonationState,
  wrapWithRoleImpersonation,
} from 'lib/role-impersonation'
import { isRoleImpersonationEnabled } from 'state/role-impersonation-state'
import { ResponseError, UseCustomQueryOptions } from 'types'

import { handleError } from '../fetchers'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { tableRowKeys } from './keys'
import { formatFilterValue } from './utils'
import { timeout } from '@/lib/helpers'

interface GetTableRowsArgs {
  table?: SupaTable
  filters?: Filter[]
  sorts?: Sort[]
  limit?: number
  page?: number
  roleImpersonationState?: RoleImpersonationState
}

/**
 * Get the preferred columns for sorting of a table.
 *
 * Use the primary key if it exists, otherwise use a unique index with
 * non-nullable columns. If all else fails, fall back to any sortable column.
 */
const getPreferredOrderByColumns = (
  table: SupaTable
): { cursorPaginationEligible: string[][]; cursorPaginationNonEligible: string[] } => {
  const cursorPaginationEligible: string[][] = []
  const cursorPaginationNonEligible: string[] = []

  const primaryKeyColumns = table.primaryKey
  if (primaryKeyColumns) {
    cursorPaginationEligible.push(primaryKeyColumns)
  }

  const uniqueIndexes = table.uniqueIndexes
  const cursorFriendlyUniqueIndexes = uniqueIndexes?.filter((index) => {
    return index.every((columnName) => {
      const column = table.columns.find((column) => column.name === columnName)
      return !!column && !column.isNullable
    })
  })
  if (cursorFriendlyUniqueIndexes) {
    cursorPaginationEligible.push(...cursorFriendlyUniqueIndexes)
  }

  const eligibleColumnsForSorting = table.columns.filter((x) => !x.dataType.includes('json'))
  cursorPaginationNonEligible.push(...eligibleColumnsForSorting.map((col) => col.name))

  return {
    cursorPaginationEligible,
    cursorPaginationNonEligible,
  }
}

function getErrorCode(error: any): number | undefined {
  // Our custom ResponseError's use 'code' instead of 'status'
  if (error instanceof ResponseError) {
    return error.code
  }
  return error.status
}

function getRetryAfter(error: any): number | undefined {
  if (error instanceof ResponseError) {
    return error.retryAfter
  }

  const headerRetry = error.headers?.get('retry-after')
  if (headerRetry) {
    return parseInt(headerRetry)
  }

  return undefined
}

export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      const errorCode = getErrorCode(error)
      if (errorCode === 429 && attempt < maxRetries) {
        // Get retry delay from headers or use exponential backoff (1s, then 2s, then 4s)
        const retryAfter = getRetryAfter(error)
        const delayMs = retryAfter ? retryAfter * 1000 : baseDelay * Math.pow(2, attempt)

        await timeout(delayMs)
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries reached without success')
}

const checkIfCtidAvailable = (table: SupaTable): boolean =>
  table.type === ENTITY_TYPE.TABLE ||
  table.type === ENTITY_TYPE.PARTITIONED_TABLE ||
  table.type === ENTITY_TYPE.MATERIALIZED_VIEW

export const getAllTableRowsSql = ({
  table,
  filters = [],
  sorts = [],
}: {
  table: SupaTable
  filters?: Filter[]
  sorts?: Sort[]
}): { sql: QueryFilter; cursorColumns: string[] | false } => {
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

  let cursorColumns: string[] | false = false
  const { cursorPaginationEligible, cursorPaginationNonEligible } =
    getPreferredOrderByColumns(table)

  const hasCtid = checkIfCtidAvailable(table)

  if (sorts.length === 0) {
    if (cursorPaginationEligible.length > 0) {
      cursorColumns = cursorPaginationEligible[0]
      cursorPaginationEligible[0].forEach((col) => {
        queryChains = queryChains.order(table.name, col)
      })
      // Cursor paginated columns do not require ctid fallback as they
      // guarantee uniqueness
    } else if (cursorPaginationNonEligible.length > 0) {
      queryChains = queryChains.order(table.name, cursorPaginationNonEligible[0])
      if (hasCtid) {
        queryChains = queryChains.order(table.name, 'ctid')
      }
    } else {
      if (hasCtid) {
        queryChains = queryChains.order(table.name, 'ctid')
      }
    }
  } else {
    sorts.forEach((sort) => {
      queryChains = queryChains.order(sort.table, sort.column, sort.ascending, sort.nullsFirst)
    })

    // Add tie-breakers so page order doesn't shuffle
    const tieBreaker = cursorPaginationEligible[0]
    if (tieBreaker) {
      const sortedColumns = new Set(
        sorts.filter((s) => s.table === table.name).map((s) => s.column)
      )
      tieBreaker
        .filter((col) => !sortedColumns.has(col))
        .forEach((col) => {
          queryChains = queryChains.order(table.name, col)
        })
    } else {
      if (hasCtid) {
        queryChains = queryChains.order(table.name, 'ctid')
      }
    }
  }

  return { sql: queryChains, cursorColumns }
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
  const { sql: queryChains, cursorColumns } = getAllTableRowsSql({
    table,
    sorts,
    filters,
  })

  const rowsPerPage = 500
  const THROTTLE_DELAY = 500

  if (cursorColumns) {
    let cursor: Record<string, any> | null = null
    while (true) {
      let queryChainsWithCursor = queryChains.clone()

      if (cursor) {
        queryChainsWithCursor = queryChainsWithCursor.filter(
          cursorColumns,
          '>',
          cursorColumns.map((col) => cursor![col])
        )
      }
      const query = wrapWithRoleImpersonation(
        queryChainsWithCursor.range(0, rowsPerPage - 1).toSql(),
        roleImpersonationState
      )

      try {
        const { result } = await executeWithRetry(async () =>
          executeSql({ projectRef, connectionString, sql: query })
        )
        rows.push(...result)
        progressCallback?.(rows.length)

        cursor = {}
        for (const col of cursorColumns) {
          cursor[col] = result[result.length - 1]?.[col]
        }

        if (result.length < rowsPerPage) break

        await timeout(THROTTLE_DELAY)
      } catch (error) {
        throw new Error(
          `Error fetching all table rows: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }
  } else {
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

        await timeout(THROTTLE_DELAY)
      } catch (error) {
        throw new Error(
          `Error fetching all table rows: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }
  }

  return rows.filter((row) => row[ROLE_IMPERSONATION_NO_RESULTS] !== 1)
}

type TableRows = { rows: SupaRow[] }

type TableRowsVariables = Omit<GetTableRowsArgs, 'table'> & {
  queryClient: QueryClient
  projectRef?: string
  connectionString?: string | null
  tableId?: number
  preflightCheck?: boolean
}

export type TableRowsData = TableRows
type TableRowsError = ExecuteSqlError

async function getTableRows(
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
    preflightCheck = false,
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

  const equalityFilterColumns = filters
    ?.filter((filter) => filter.operator === '=' || filter.operator === 'is')
    .flatMap((filter) => filter.column)

  // There is an edge case for MS SQL foreign tables, where the Postgres query
  // planner may drop sorts that are redundant with filters, resulting in
  // invalid MS SQL syntax. To prevent this, we exclude potentially conflicting
  // columns from potential default sort columns.
  const excludedColumns = isMsSqlForeignTable(entity)
    ? Array.from(new Set(equalityFilterColumns))
    : undefined

  const sql = wrapWithRoleImpersonation(
    getTableRowsSql({
      table: entity,
      filters,
      sorts,
      limit,
      page,
      sortExcludedColumns: excludedColumns,
    }),
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
        preflightCheck,
      },
      signal
    )

    const rows = result.map((x: any, index: number) => {
      return { idx: index, ...x }
    }) as SupaRow[]

    return { rows }
  } catch (error) {
    throw handleError(error)
  }
}

export const useTableRowsQuery = <TData = TableRowsData>(
  { projectRef, connectionString, tableId, ...args }: Omit<TableRowsVariables, 'queryClient'>,
  { enabled = true, ...options }: UseCustomQueryOptions<TableRowsData, TableRowsError, TData> = {}
) => {
  const queryClient = useQueryClient()

  return useQuery<TableRowsData, TableRowsError, TData>({
    queryKey: tableRowKeys.tableRows(projectRef, {
      table: { id: tableId },
      ...args,
    }),
    queryFn: ({ signal }) =>
      getTableRows({ queryClient, projectRef, connectionString, tableId, ...args }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof tableId !== 'undefined',
    ...options,
  })
}

export function prefetchTableRows(
  client: QueryClient,
  { projectRef, connectionString, tableId, ...args }: Omit<TableRowsVariables, 'queryClient'>
) {
  return client.fetchQuery({
    queryKey: tableRowKeys.tableRows(projectRef, {
      table: { id: tableId },
      ...args,
    }),
    queryFn: ({ signal }) =>
      getTableRows({ queryClient: client, projectRef, connectionString, tableId, ...args }, signal),
  })
}
