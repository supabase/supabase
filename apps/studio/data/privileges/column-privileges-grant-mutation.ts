import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { components } from 'data/api'
import type { ResponseError } from 'types'
import { privilegeKeys } from './keys'
import pgMeta from '@supabase/pg-meta'
import { executeSql } from 'data/sql/execute-sql-query'

export type ColumnPrivilegesGrant = components['schemas']['GrantColumnPrivilegesBody']

export type ColumnPrivilegesGrantVariables = {
  projectRef: string
  connectionString?: string | null
  grants: ColumnPrivilegesGrant
}

export async function grantColumnPrivileges({
  projectRef,
  connectionString,
  grants,
}: ColumnPrivilegesGrantVariables) {
  const { sql } = pgMeta.columnPrivileges.grant(
    grants.map((g) => ({
      columnId: g.column_id,
      grantee: g.grantee,
      privilegeType: g.privilege_type,
      isGrantable: g.is_grantable,
    }))
  )

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['column-privileges', 'grant'],
  })

  return result
}

type ColumnPrivilegesGrantData = Awaited<ReturnType<typeof grantColumnPrivileges>>

export const useColumnPrivilegesGrantMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ColumnPrivilegesGrantData, ResponseError, ColumnPrivilegesGrantVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ColumnPrivilegesGrantData, ResponseError, ColumnPrivilegesGrantVariables>(
    (vars) => grantColumnPrivileges(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await Promise.all([
          queryClient.invalidateQueries(privilegeKeys.columnPrivilegesList(projectRef)),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to mutate: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
