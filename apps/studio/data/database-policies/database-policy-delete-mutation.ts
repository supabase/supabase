import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databasePoliciesKeys } from './keys'

export type DatabasePolicyDeleteVariables = {
  projectRef: string
  connectionString?: string
  id: number
}

export async function deleteDatabasePolicy({
  projectRef,
  connectionString,
  id,
}: DatabasePolicyDeleteVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await del('/platform/pg-meta/{ref}/policies', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      query: { id },
    },
    headers,
  })

  if (error) handleError(error)
  return data
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
