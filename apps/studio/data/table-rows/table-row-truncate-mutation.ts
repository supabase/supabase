import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { Query, SupaTable } from 'components/grid'
import { User } from 'data/auth/users-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'
import { wrapWithUserImpersonation } from 'lib/user-impersonation'
import { ResponseError } from 'types'

export type TableRowTruncateVariables = {
  projectRef: string
  connectionString?: string
  table: SupaTable
  impersonatedUser?: User | null
}

export function getTableRowTruncateSql({ table }: Pick<TableRowTruncateVariables, 'table'>) {
  let queryChains = new Query().from(table.name, table.schema ?? undefined).truncate()

  return queryChains.toSql()
}

export async function truncateTableRow({
  projectRef,
  connectionString,
  table,
  impersonatedUser,
}: TableRowTruncateVariables) {
  const sql = wrapWithUserImpersonation(getTableRowTruncateSql({ table }), impersonatedUser)

  const { result } = await executeSql({ projectRef, connectionString, sql })

  return result
}

type TableRowTruncateData = Awaited<ReturnType<typeof truncateTableRow>>

export const useTableRowTruncateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TableRowTruncateData, ResponseError, TableRowTruncateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableRowTruncateData, ResponseError, TableRowTruncateVariables>(
    (vars) => truncateTableRow(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, table } = variables
        await queryClient.invalidateQueries(sqlKeys.query(projectRef, [table.schema, table.name]))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to truncate table row: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
