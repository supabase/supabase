import {
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'

import { IS_PLATFORM } from 'common'
import { Query } from 'components/grid/query/Query'
import { parseSupaTable } from 'components/grid/SupabaseGrid.utils'
import { Filter, Sort, SupaRow, SupaTable } from 'components/grid/types'
import {
  JSON_TYPES,
  TEXT_TYPES,
} from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.constants'
import { prefetchTableEditor } from 'data/table-editor/table-editor-query'
import { KB } from 'lib/constants'
import {
  ImpersonationRole,
  ROLE_IMPERSONATION_NO_RESULTS,
  wrapWithRoleImpersonation,
} from 'lib/role-impersonation'
import { isRoleImpersonationEnabled } from 'state/role-impersonation-state'
import { ExecuteSqlError, executeSql } from '../sql/execute-sql-query'
import { getPagination } from '../utils/pagination'
import { tableRowKeys } from './keys'
import { THRESHOLD_COUNT } from './table-rows-count-query'
import { formatFilterValue } from './utils'

export interface GetTableRowsArgs {
  table?: SupaTable
  filters?: Filter[]
  sorts?: Sort[]
  limit?: number
  page?: number
  impersonatedRole?: ImpersonationRole
}

// [Joshen] We can probably make this reasonably high, but for now max aim to load 10kb
export const MAX_CHARACTERS = 10 * KB

// return the primary key columns if exists, otherwise return the first column to use as a default sort
const getDefaultOrderByColumns = (table: SupaTable) => {
  const primaryKeyColumns = table.columns.filter((col) => col?.isPrimaryKey).map((col) => col.name)
  if (primaryKeyColumns.length === 0) {
    return [table.columns[0]?.name]
  } else {
    return primaryKeyColumns
  }
}

// Updated fetchAllTableRows function
export const fetchAllTableRows = async ({
  projectRef,
  connectionString,
  table,
  filters = [],
  sorts = [],
  impersonatedRole,
}: {
  projectRef: string
  connectionString?: string
  table: SupaTable
  filters?: Filter[]
  sorts?: Sort[]
  impersonatedRole?: ImpersonationRole
}) => {
  if (IS_PLATFORM && !connectionString) {
    console.error('Connection string is required')
    return []
  }

  const rows: any[] = []
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
        queryChains = queryChains.order(table.name, col, true, true)
      })
    }
  } else {
    sorts.forEach((sort) => {
      queryChains = queryChains.order(sort.table, sort.column, sort.ascending, sort.nullsFirst)
    })
  }

  // Starting from page 0, fetch 500 records per call
  let page = -1
  let from = 0
  let to = 0
  let pageData = []
  const rowsPerPage = 500

  await (async () => {
    do {
      page += 1
      from = page * rowsPerPage
      to = (page + 1) * rowsPerPage - 1
      const query = wrapWithRoleImpersonation(queryChains.range(from, to).toSql(), {
        projectRef,
        role: impersonatedRole,
      })

      try {
        const { result } = await executeSql({ projectRef, connectionString, sql: query })
        rows.push(...result)
        pageData = result
      } catch (error) {
        return { data: { rows: [] } }
      }
    } while (pageData.length === rowsPerPage)
  })()

  return rows.filter((row) => row[ROLE_IMPERSONATION_NO_RESULTS] !== 1)
}

export const getTableRowsSql = ({
  table,
  filters = [],
  sorts = [],
  page,
  limit,
}: GetTableRowsArgs) => {
  const query = new Query()

  if (!table) return ``

  const arrayBasedColumns = table.columns
    .filter(
      (column) => (column?.enum ?? []).length > 0 && column.dataType.toLowerCase() === 'array'
    )
    .map((column) => `"${column.name}"::text[]`)

  let queryChains = query
    .from(table.name, table.schema ?? undefined)
    .select(arrayBasedColumns.length > 0 ? `*,${arrayBasedColumns.join(',')}` : '*')

  filters
    .filter((x) => x.value && x.value != '')
    .forEach((x) => {
      const value = formatFilterValue(table, x)
      queryChains = queryChains.filter(x.column, x.operator, value)
    })

  // If sorts is empty and table row count is within threshold, use the primary key as the default sort
  if (sorts.length === 0 && table.estimateRowCount <= THRESHOLD_COUNT && table.columns.length > 0) {
    const defaultOrderByColumns = getDefaultOrderByColumns(table)
    if (defaultOrderByColumns.length > 0) {
      defaultOrderByColumns.forEach((col) => {
        queryChains = queryChains.order(table.name, col, true, true)
      })
    }
  } else {
    sorts.forEach((x) => {
      queryChains = queryChains.order(x.table, x.column, x.ascending, x.nullsFirst)
    })
  }

  // getPagination is expecting to start from 0
  const { from, to } = getPagination((page ?? 1) - 1, limit)
  const baseSql = queryChains.range(from, to).toSql()

  // [Joshen] Only truncate text/json based columns as their length could go really big
  // Note: Risk of payload being too large if the user has many many text/json based columns
  // although possibly negligible risk.
  const truncatedColumns = table.columns
    .filter((column) => TEXT_TYPES.includes(column.format) || JSON_TYPES.includes(column.format))
    .map((column) => {
      return `case when length("${column.name}"::text) > ${MAX_CHARACTERS} then concat(left("${column.name}"::text, ${MAX_CHARACTERS}), '...') else "${column.name}"::text end "${column.name}"`
    })
  const outputSql =
    truncatedColumns.length > 0
      ? `with _temp as (${baseSql.slice(0, -1)}) select *, ${truncatedColumns.join(',')} from _temp`
      : baseSql

  return outputSql
}

export type TableRows = { rows: SupaRow[] }

export type TableRowsVariables = Omit<GetTableRowsArgs, 'table'> & {
  queryClient: QueryClient
  projectRef?: string
  connectionString?: string
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
    impersonatedRole,
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
    getTableRowsSql({ table, filters, sorts, limit, page, impersonatedRole }),
    {
      projectRef: projectRef ?? 'ref',
      role: impersonatedRole,
    }
  )
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['table-rows', table?.id],
      isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRole),
    },
    signal
  )

  const rows = result.map((x: any, index: number) => {
    return { idx: index, ...x }
  }) as SupaRow[]

  return {
    rows,
  }
}

export const useTableRowsQuery = <TData = TableRowsData>(
  { projectRef, connectionString, tableId, ...args }: Omit<TableRowsVariables, 'queryClient'>,
  { enabled = true, ...options }: UseQueryOptions<TableRowsData, TableRowsError, TData> = {}
) => {
  const queryClient = useQueryClient()
  return useQuery<TableRowsData, TableRowsError, TData>(
    tableRowKeys.tableRows(projectRef, { table: { id: tableId }, ...args }),
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
  {
    projectRef,
    connectionString,
    tableId,
    impersonatedRole,
    ...args
  }: Omit<TableRowsVariables, 'queryClient'>
) {
  return client.fetchQuery(
    tableRowKeys.tableRows(projectRef, { table: { id: tableId }, ...args }),
    ({ signal }) =>
      getTableRows({ queryClient: client, projectRef, connectionString, tableId, ...args }, signal)
  )
}
