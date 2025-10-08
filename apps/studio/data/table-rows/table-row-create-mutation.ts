import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Query } from '@supabase/pg-meta/src/query'
import { executeSql } from 'data/sql/execute-sql-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { RoleImpersonationState, wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { isRoleImpersonationEnabled } from 'state/role-impersonation-state'
import type { ResponseError } from 'types'
import { tableRowKeys } from './keys'

export type TableRowCreateVariables = {
  projectRef: string
  connectionString?: string | null
  table: { id: number; name: string; schema?: string }
  payload: any
  enumArrayColumns: string[]
  returning?: boolean
  roleImpersonationState?: RoleImpersonationState
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
  roleImpersonationState,
}: TableRowCreateVariables) {
  const sql = wrapWithRoleImpersonation(
    getTableRowCreateSql({ table, payload, enumArrayColumns, returning }),
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
  const { mutate: sendEvent } = useSendEventMutation()
  const { data: org } = useSelectedOrganizationQuery()

  return useMutation<TableRowCreateData, ResponseError, TableRowCreateVariables>(
    (vars) => createTableRow(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, table } = variables

        // Track data insertion event
        try {
          sendEvent({
            action: 'table_data_added',
            properties: {
              method: 'table_editor',
              schema_name: table.schema,
              table_name: table.name,
            },
            groups: {
              project: projectRef,
              ...(org?.slug && { organization: org.slug }),
            },
          })
        } catch (error) {
          console.error('Failed to track table data insertion event:', error)
        }

        await queryClient.invalidateQueries(tableRowKeys.tableRowsAndCount(projectRef, table.id))
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
