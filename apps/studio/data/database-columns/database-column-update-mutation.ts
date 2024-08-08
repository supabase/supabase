import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'

export type UpdateColumnBody = components['schemas']['UpdateColumnBody']

export type DatabaseColumnUpdateVariables = {
  projectRef: string
  connectionString?: string
  id: string
  payload: components['schemas']['UpdateColumnBody']
}

export async function updateDatabaseColumn({
  projectRef,
  connectionString,
  id,
  payload,
}: DatabaseColumnUpdateVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await patch('/platform/pg-meta/{ref}/columns', {
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

type DatabaseColumnUpdateData = Awaited<ReturnType<typeof updateDatabaseColumn>>

export const useDatabaseColumnUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseColumnUpdateData, ResponseError, DatabaseColumnUpdateVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<DatabaseColumnUpdateData, ResponseError, DatabaseColumnUpdateVariables>(
    (vars) => updateDatabaseColumn(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update database column: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
