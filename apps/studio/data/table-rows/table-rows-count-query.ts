import { getTableRowsCountSql } from '@supabase/pg-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import { IS_PLATFORM, useFlag } from 'common'

import { tableRowKeys } from './keys'
import { formatFilterValue } from './utils'
import { parseSupaTable } from '@/components/grid/SupabaseGrid.utils'
import type { Filter, SupaTable } from '@/components/grid/types'
import { useConnectionStringForReadOps } from '@/data/read-replicas/replicas-query'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import {
  PG_META_SCOPED_INTROSPECTION_FLAG,
  prefetchTableEditor,
} from '@/data/table-editor/table-editor-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { RoleImpersonationState, wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import { isRoleImpersonationEnabled } from '@/state/role-impersonation-state'
import { ResponseError, UseCustomQueryOptions } from '@/types'

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
  scoped?: boolean
}

export type TableRowsCountData = TableRowsCount
export type TableRowsCountError = ResponseError

export async function getTableRowsCount(
  {
    queryClient,
    projectRef,
    connectionString,
    tableId,
    filters,
    roleImpersonationState,
    enforceExactCount,
    isReadOnlyContext = false,
    scoped,
  }: TableRowsCountVariables & { isReadOnlyContext?: boolean },
  signal?: AbortSignal
) {
  const entity = await prefetchTableEditor(queryClient, {
    projectRef,
    connectionString,
    id: tableId,
    scoped,
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
      isReadOnlyContext,
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
  const { can: canSQLAdminWrite } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )
  const scoped = !!useFlag(PG_META_SCOPED_INTROSPECTION_FLAG)

  return useQuery<TableRowsCountData, TableRowsCountError, TData>({
    queryKey: tableRowKeys.tableRowsCount(projectRef, {
      table: { id: tableId },
      readReplicaIdentifier,
      ...args,
      scoped,
    }),
    queryFn: ({ signal }) =>
      getTableRowsCount(
        {
          queryClient,
          projectRef,
          connectionString,
          tableId,
          isReadOnlyContext: type === 'replica' || !canSQLAdminWrite,
          ...args,
          scoped,
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
