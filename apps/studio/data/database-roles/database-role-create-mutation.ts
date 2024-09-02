import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { invalidateRolesQuery } from './database-roles-query'

type CreateRoleBody = Parameters<typeof pgMeta.roles.create>[0]

export type DatabaseRoleCreateVariables = {
  projectRef: string
  connectionString?: string
  payload: CreateRoleBody
}

export async function createDatabaseRole({
  projectRef,
  connectionString,
  payload,
}: DatabaseRoleCreateVariables) {
  const sql = pgMeta.roles.create(payload).sql
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['roles', 'create'],
  })
  return result
}

type DatabaseRoleCreateData = Awaited<ReturnType<typeof createDatabaseRole>>

export const useDatabaseRoleCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseRoleCreateData, ResponseError, DatabaseRoleCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseRoleCreateData, ResponseError, DatabaseRoleCreateVariables>(
    (vars) => createDatabaseRole(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await invalidateRolesQuery(queryClient, projectRef)
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create database role: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
