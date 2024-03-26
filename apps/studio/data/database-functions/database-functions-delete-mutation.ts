import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { del } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseFunctionsKeys } from './keys'

export type DatabaseFunctionDeleteVariables = {
  projectRef: string
  connectionString?: string
  id: number
}

export async function deleteDatabaseFunction({
  projectRef,
  connectionString,
  id,
}: DatabaseFunctionDeleteVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await del('/platform/pg-meta/{ref}/functions', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      query: { id },
    },
    headers,
  })

  if (error) throw error
  return data
}

type DatabaseFunctionDeleteData = Awaited<ReturnType<typeof deleteDatabaseFunction>>

export const useDatabaseFunctionDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseFunctionDeleteData, ResponseError, DatabaseFunctionDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseFunctionDeleteData, ResponseError, DatabaseFunctionDeleteVariables>(
    (vars) => deleteDatabaseFunction(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseFunctionsKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database function: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
