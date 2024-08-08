import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databasePoliciesKeys } from './keys'

export type DatabasePolicyUpdateVariables = {
  projectRef: string
  connectionString?: string
  id: number
  payload: {
    name?: string
    definition?: string
    check?: string
    roles?: string[]
  }
}

export async function updateDatabasePolicy({
  projectRef,
  connectionString,
  id,
  payload,
}: DatabasePolicyUpdateVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await patch('/platform/pg-meta/{ref}/policies', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      query: { id },
    },
    body: payload,
    headers,
  })

  if (error) handleError(error)
  return data
}

type DatabasePolicyUpdateData = Awaited<ReturnType<typeof updateDatabasePolicy>>

export const useDatabasePolicyUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabasePolicyUpdateData, ResponseError, DatabasePolicyUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabasePolicyUpdateData, ResponseError, DatabasePolicyUpdateVariables>(
    (vars) => updateDatabasePolicy(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databasePoliciesKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update database policy: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
