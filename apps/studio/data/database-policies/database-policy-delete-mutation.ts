import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databasePoliciesKeys } from './keys'

export type DatabasePolicyDeleteVariables = {
  projectRef: string
  connectionString?: string | null
  originalPolicy: {
    id: number
    name: string
    schema: string
    table: string
  }
}

export async function deleteDatabasePolicy({
  projectRef,
  connectionString,
  originalPolicy,
}: DatabasePolicyDeleteVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { sql } = pgMeta.policies.remove(originalPolicy)
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['policy', 'delete', originalPolicy.id],
  })

  return result
}

type DatabasePolicyDeleteData = Awaited<ReturnType<typeof deleteDatabasePolicy>>

export const useDatabasePolicyDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabasePolicyDeleteData, ResponseError, DatabasePolicyDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabasePolicyDeleteData, ResponseError, DatabasePolicyDeleteVariables>(
    (vars) => deleteDatabasePolicy(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databasePoliciesKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database policy: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
