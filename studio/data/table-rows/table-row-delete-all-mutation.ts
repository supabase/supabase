import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { Filter, Query, SupaTable } from 'components/grid'
import { User } from 'data/auth/users-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'
import { wrapWithUserImpersonation } from 'lib/user-impersonation'
import { ResponseError } from 'types'
import { formatFilterValue } from './utils'

export type TableRowDeleteAllVariables = {
  projectRef: string
  connectionString?: string
  table: SupaTable
  filters: Filter[]
  impersonatedUser?: User | null
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
  impersonatedUser,
}: TableRowDeleteAllVariables) {
  const sql = wrapWithUserImpersonation(
    getTableRowDeleteAllSql({ table, filters }),
    impersonatedUser
  )

  const { result } = await executeSql({ projectRef, connectionString, sql })

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
        await queryClient.invalidateQueries(sqlKeys.query(projectRef, [table.schema, table.name]))
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
