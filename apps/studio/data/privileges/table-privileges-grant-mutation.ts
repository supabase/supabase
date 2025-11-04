import pgMeta from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { privilegeKeys } from './keys'
import { invalidateTablePrivilegesQuery } from './table-privileges-query'

export type TablePrivilegesGrant = Parameters<
  typeof pgMeta.tablePrivileges.grant
>[0] extends (infer T)[]
  ? T
  : never

export type TablePrivilegesGrantVariables = {
  projectRef: string
  connectionString?: string | null
  grants: TablePrivilegesGrant[]
}

export async function grantTablePrivileges({
  projectRef,
  connectionString,
  grants,
}: TablePrivilegesGrantVariables) {
  const sql = pgMeta.tablePrivileges.grant(grants).sql
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['table-privileges', 'grant'],
  })
  return result
}

type TablePrivilegesGrantData = Awaited<ReturnType<typeof grantTablePrivileges>>

export const useTablePrivilegesGrantMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<TablePrivilegesGrantData, ResponseError, TablePrivilegesGrantVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TablePrivilegesGrantData, ResponseError, TablePrivilegesGrantVariables>({
    mutationFn: (vars) => grantTablePrivileges(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await Promise.all([
        invalidateTablePrivilegesQuery(queryClient, projectRef),
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
