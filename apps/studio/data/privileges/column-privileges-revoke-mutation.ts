import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { components } from 'data/api'
import type { ResponseError } from 'types'
import pgMeta from '@supabase/pg-meta'
import { executeSql } from 'data/sql/execute-sql-query'
import { privilegeKeys } from './keys'

export type ColumnPrivilegesRevoke = components['schemas']['RevokeColumnPrivilegesBody']

export type ColumnPrivilegesRevokeVariables = {
  projectRef: string
  connectionString?: string | null
  revokes: ColumnPrivilegesRevoke
}

export async function revokeColumnPrivileges({
  projectRef,
  connectionString,
  revokes,
}: ColumnPrivilegesRevokeVariables) {
  const { sql } = pgMeta.columnPrivileges.revoke(
    revokes.map((r) => ({
      columnId: r.column_id,
      grantee: r.grantee,
      privilegeType: r.privilege_type,
    }))
  )

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['column-privileges', 'revoke'],
  })

  return result
}

type ColumnPrivilegesRevokeData = Awaited<ReturnType<typeof revokeColumnPrivileges>>

export const useColumnPrivilegesRevokeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ColumnPrivilegesRevokeData, ResponseError, ColumnPrivilegesRevokeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ColumnPrivilegesRevokeData, ResponseError, ColumnPrivilegesRevokeVariables>(
    (vars) => revokeColumnPrivileges(vars),
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
