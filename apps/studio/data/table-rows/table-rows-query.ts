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
import { KB } from 'lib/constants'
import {
  ImpersonationRole,
  ROLE_IMPERSONATION_NO_RESULTS,
  wrapWithRoleImpersonation,
} from 'lib/role-impersonation'
import { isRoleImpersonationEnabled } from 'state/role-impersonation-state'
import { ExecuteSqlError, executeSql } from '../sql/execute-sql-query'
import { tableRowKeys } from './keys'
import { buildTableRowsQuery } from './table-rows-select-query-builder'

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

  // Starting from page 0, fetch 500 records per call
  let page = -1
  let pageData = []
  const rowsPerPage = 500

  await (async () => {
    do {
      page += 1

      // Use the optimized query builder with pagination
      const query = buildTableRowsQuery({
        table,
        filters,
        sorts,
        page: page + 1, // buildTableRowsQuery expects 1-indexed pages
        limit: rowsPerPage,
        impersonatedRole,
      })

      const wrappedQuery = wrapWithRoleImpersonation(query, {
        projectRef,
        role: impersonatedRole,
      })

      try {
        const { result } = await executeSql({ projectRef, connectionString, sql: wrappedQuery })
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
  impersonatedRole,
}: GetTableRowsArgs) => {
  if (!table) return ``

  // Use the extracted query builder function
  return buildTableRowsQuery({ table, filters, sorts, page, limit, impersonatedRole })
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
