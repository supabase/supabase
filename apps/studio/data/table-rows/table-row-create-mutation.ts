import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Query } from 'components/grid/query/Query'
import type { SupaTable } from 'components/grid/types'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'
import { ImpersonationRole, wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { isRoleImpersonationEnabled } from 'state/role-impersonation-state'
import type { ResponseError } from 'types'

export type TableRowCreateVariables = {
  projectRef: string
  connectionString?: string
  table: SupaTable
  payload: any
  enumArrayColumns: string[]
  returning?: boolean
  impersonatedRole?: ImpersonationRole
}

export function getTableRowCreateSql({
  table,
  payload,
  returning = false,
  enumArrayColumns,
}: Pick<TableRowCreateVariables, 'table' | 'payload' | 'enumArrayColumns' | 'returning'>) {
  return new Query()
    .from(table.name, table.schema ?? undefined)
    .insert([payload], { returning, enumArrayColumns })
    .toSql()
}

export async function createTableRow({
  projectRef,
  connectionString,
  table,
  payload,
  enumArrayColumns,
  returning,
  impersonatedRole,
}: TableRowCreateVariables) {
  const sql = wrapWithRoleImpersonation(
    getTableRowCreateSql({ table, payload, enumArrayColumns, returning }),
    {
      projectRef,
      role: impersonatedRole,
    }
  )

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRole),
  })

  return result
}

type TableRowCreateData = Awaited<ReturnType<typeof createTableRow>>

export const useTableRowCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TableRowCreateData, ResponseError, TableRowCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableRowCreateData, ResponseError, TableRowCreateVariables>(
    (vars) => createTableRow(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, table } = variables
        await queryClient.invalidateQueries(sqlKeys.query(projectRef, [table.schema, table.name]))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(data.message)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
