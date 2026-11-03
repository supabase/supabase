import pgMeta from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { invalidateRolesQuery } from './database-roles-query'
import { unguarded } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { getRolePasswordForSql } from '@/lib/scram-sha-256'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type CreateRoleBody = Parameters<typeof pgMeta.roles.create>[0]

export type DatabaseRoleCreateVariables = {
  projectRef: string
  connectionString?: string | null
  payload: CreateRoleBody
}

export async function createDatabaseRole({
  projectRef,
  connectionString,
  payload,
}: DatabaseRoleCreateVariables) {
  const password =
    payload.password === undefined ? undefined : await getRolePasswordForSql(payload.password)
  const sql = pgMeta.roles.create({ ...payload, password }).sql
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['roles', 'create'],
    grant: unguarded.migrating,
  })
  return result
}

type DatabaseRoleCreateData = Awaited<ReturnType<typeof createDatabaseRole>>

export const useDatabaseRoleCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<DatabaseRoleCreateData, ResponseError, DatabaseRoleCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseRoleCreateData, ResponseError, DatabaseRoleCreateVariables>({
    mutationFn: (vars) => createDatabaseRole(vars),
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
  })
}
