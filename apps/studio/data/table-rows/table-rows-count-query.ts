import { getTableRowsCountSql } from '@supabase/pg-meta'
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import { IS_PLATFORM } from 'common'

import { tableRowKeys } from './keys'
import { formatFilterValue } from './utils'
import { parseSupaTable } from '@/components/grid/SupabaseGrid.utils'
import type { Filter, SupaTable } from '@/components/grid/types'
import { useConnectionStringForReadOps } from '@/data/read-replicas/replicas-query'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { prefetchTableEditor } from '@/data/table-editor/table-editor-query'
import { RoleImpersonationState, wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import { isRoleImpersonationEnabled } from '@/state/role-impersonation-state'
import { UseCustomQueryOptions } from '@/types'

export type GetTableRowsCountArgs = {
  table?: SupaTable
  filters?: Filter[]
  enforceExactCount?: boolean
}

export type TableRowsCount = {
  count?: number
  is_estimate?: boolean
}

export type TableRowsCountVariables = Omit<GetTableRowsCountArgs, 'table'> & {
  queryClient: QueryClient
  tableId?: number
  roleImpersonationState?: RoleImpersonationState
  projectRef?: string
  connectionString?: string | null
}

export type TableRowsCountData = TableRowsCount
export type TableRowsCountError = ExecuteSqlError

export async function getTableRowsCount(
  {
    queryClient,
    projectRef,
    connectionString,
    tableId,
    filters,
    roleImpersonationState,
    enforceExactCount,
    isUsingReadReplica = false,
  }: TableRowsCountVariables & { isUsingReadReplica?: boolean },
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

  const formattedFilters = filters?.map((x) => ({ ...x, value: formatFilterValue(table, x) }))
  const sql = wrapWithRoleImpersonation(
    getTableRowsCountSql({
      table,
      filters: formattedFilters,
      enforceExactCount,
      isUsingReadReplica,
    }),
    roleImpersonationState
  )
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['table-rows-count', table.id],
      isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
    },
    signal
  )

  return {
    count: result?.[0]?.count,
    is_estimate: result?.[0]?.is_estimate ?? false,
  } as TableRowsCount
}

export const useTableRowsCountQuery = <TData = TableRowsCountData>(
  {
    projectRef,
    tableId,
    ...args
  }: Omit<TableRowsCountVariables, 'queryClient' | 'connectionString'>,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<TableRowsCountData, TableRowsCountError, TData> = {}
) => {
  const queryClient = useQueryClient()
  const {
    connectionString,
    identifier: readReplicaIdentifier,
    type,
  } = useConnectionStringForReadOps()

  return useQuery<TableRowsCountData, TableRowsCountError, TData>({
    queryKey: tableRowKeys.tableRowsCount(projectRef, {
      table: { id: tableId },
      readReplicaIdentifier,
      ...args,
    }),
    queryFn: ({ signal }) =>
      getTableRowsCount(
        {
          queryClient,
          projectRef,
          connectionString,
          tableId,
          isUsingReadReplica: type === 'replica',
          ...args,
        },
        signal
      ),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof tableId !== 'undefined' &&
      (!IS_PLATFORM || typeof connectionString !== 'undefined'),
    ...options,
  })
}
