import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import type { components } from 'data/api'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseFunctionsKeys } from './keys'

export type DatabaseFunctionUpdateVariables = {
  projectRef: string
  connectionString?: string
  id: number
  payload: components['schemas']['UpdateFunctionBody']
}

export async function updateDatabaseFunction({
  projectRef,
  connectionString,
  id,
  payload,
}: DatabaseFunctionUpdateVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await patch('/platform/pg-meta/{ref}/functions', {
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

type DatabaseFunctionUpdateData = Awaited<ReturnType<typeof updateDatabaseFunction>>

export const useDatabaseFunctionUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseFunctionUpdateData, ResponseError, DatabaseFunctionUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseFunctionUpdateData, ResponseError, DatabaseFunctionUpdateVariables>(
    (vars) => updateDatabaseFunction(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseFunctionsKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update database function: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
