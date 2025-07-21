import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Query } from '@supabase/pg-meta/src/query'
import type { Filter } from 'components/grid/types'
import { executeSql } from 'data/sql/execute-sql-query'
import { Entity } from 'data/table-editor/table-editor-types'
import { RoleImpersonationState, wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { isRoleImpersonationEnabled } from 'state/role-impersonation-state'
import type { ResponseError } from 'types'
import { tableRowKeys } from './keys'
import { formatFilterValue } from './utils'

export type TableRowDeleteAllVariables = {
  projectRef: string
  connectionString?: string | null
  table: Entity
  filters: Filter[]
  roleImpersonationState?: RoleImpersonationState
}

export function getTableRowDeleteAllSql({
  table,
  filters,
}: Pick<TableRowDeleteAllVariables, 'table' | 'filters'>) {
  let queryChains = new Query().from(table.name, table.schema ?? undefined).delete()

  filters
    .filter((x) => x.value && x.value !== '')
    .forEach((x) => {
      const value = formatFilterValue(table, x)
      queryChains = queryChains.filter(x.column, x.operator, value)
    })

  return queryChains.toSql()
}

export async function deleteAllTableRow({
  projectRef,
  connectionString,
  table,
  filters,
  roleImpersonationState,
}: TableRowDeleteAllVariables) {
  const sql = wrapWithRoleImpersonation(
    getTableRowDeleteAllSql({ table, filters }),
    roleImpersonationState
  )

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
  })

  return result
}

type TableRowDeleteAllData = Awaited<ReturnType<typeof deleteAllTableRow>>

/**
 * For deleting all rows based on a given filter
 */
export const useTableRowDeleteAllMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TableRowDeleteAllData, ResponseError, TableRowDeleteAllVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableRowDeleteAllData, ResponseError, TableRowDeleteAllVariables>(
    (vars) => deleteAllTableRow(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, table } = variables
        await queryClient.invalidateQueries(tableRowKeys.tableRowsAndCount(projectRef, table.id))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete all table rows: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
