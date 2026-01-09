import pgMeta from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { toast } from 'sonner'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { privilegeKeys } from './keys'

export type ColumnPrivilegesRevoke = {
  column_id: string
  grantee: string
  privilege_type: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'REFERENCES'
}

export type ColumnPrivilegesRevokeVariables = {
  projectRef: string
  connectionString?: string | null
  revokes: ColumnPrivilegesRevoke[]
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
  UseCustomMutationOptions<
    ColumnPrivilegesRevokeData,
    ResponseError,
    ColumnPrivilegesRevokeVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ColumnPrivilegesRevokeData, ResponseError, ColumnPrivilegesRevokeVariables>({
    mutationFn: (vars) => revokeColumnPrivileges(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: privilegeKeys.columnPrivilegesList(projectRef) }),
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
  })
}
