import pgMeta from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { databasePoliciesKeys } from './keys'

export type CreatePolicyBody = {
  name: string
  table: string
  schema?: string
  definition?: string
  check?: string
  action?: 'PERMISSIVE' | 'RESTRICTIVE'
  command?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  roles?: string[]
}

export type DatabasePolicyCreateVariables = {
  projectRef: string
  connectionString?: string | null
  payload: CreatePolicyBody
}

export async function createDatabasePolicy({
  projectRef,
  connectionString,
  payload,
}: DatabasePolicyCreateVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { sql } = pgMeta.policies.create(payload)
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['policy', 'create'],
  })

  return result
}

type DatabasePolicyCreateData = Awaited<ReturnType<typeof createDatabasePolicy>>

export const useDatabasePolicyCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<DatabasePolicyCreateData, ResponseError, DatabasePolicyCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabasePolicyCreateData, ResponseError, DatabasePolicyCreateVariables>({
    mutationFn: (vars) => createDatabasePolicy(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: databasePoliciesKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create database policy: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
