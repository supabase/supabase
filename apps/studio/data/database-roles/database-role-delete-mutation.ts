import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { invalidateRolesQuery } from './database-roles-query'

type DropRoleBody = Parameters<typeof pgMeta.roles.remove>[1]

export type DatabaseRoleDeleteVariables = {
  projectRef: string
  connectionString?: string
  id: number
  payload?: DropRoleBody
}

export async function deleteDatabaseRole({
  projectRef,
  connectionString,
  id,
  payload,
}: DatabaseRoleDeleteVariables) {
  const sql = pgMeta.roles.remove({ id }, payload).sql
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['roles', 'delete'],
  })
  return result
}

type DatabaseRoleDeleteData = Awaited<ReturnType<typeof deleteDatabaseRole>>

export const useDatabaseRoleDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseRoleDeleteData, ResponseError, DatabaseRoleDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseRoleDeleteData, ResponseError, DatabaseRoleDeleteVariables>(
    (vars) => deleteDatabaseRole(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await invalidateRolesQuery(queryClient, projectRef)
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database role: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
