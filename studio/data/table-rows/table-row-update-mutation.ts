import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { Query, SupaTable } from 'components/grid'
import { User } from 'data/auth/users-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'
import { wrapWithUserImpersonation } from 'lib/user-impersonation'
import { ResponseError } from 'types'

export type TableRowUpdateVariables = {
  projectRef: string
  connectionString?: string
  table: SupaTable
  configuration: { identifiers: any }
  payload: any
  enumArrayColumns: string[]
  impersonatedUser?: User | null
}

export function getTableRowUpdateSql({
  table,
  configuration,
  payload,
  enumArrayColumns,
}: Pick<TableRowUpdateVariables, 'table' | 'payload' | 'configuration' | 'enumArrayColumns'>) {
  return new Query()
    .from(table.name, table.schema ?? undefined)
    .update(payload, { returning: true, enumArrayColumns })
    .match(configuration.identifiers)
    .toSql()
}

export async function updateTableRow({
  projectRef,
  connectionString,
  table,
  payload,
  configuration,
  enumArrayColumns,
  impersonatedUser,
}: TableRowUpdateVariables) {
  const sql = wrapWithUserImpersonation(
    getTableRowUpdateSql({ table, configuration, payload, enumArrayColumns }),
    impersonatedUser
  )

  const { result } = await executeSql({ projectRef, connectionString, sql })

  return result
}

type TableRowUpdateData = Awaited<ReturnType<typeof updateTableRow>>

export const useTableRowUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TableRowUpdateData, ResponseError, TableRowUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableRowUpdateData, ResponseError, TableRowUpdateVariables>(
    (vars) => updateTableRow(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, table } = variables
        await queryClient.invalidateQueries(sqlKeys.query(projectRef, [table.schema, table.name]))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update table row: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
