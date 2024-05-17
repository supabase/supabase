import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import type { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type CreateColumnBody = components['schemas']['CreateColumnBody']

export type DatabaseColumnCreateVariables = {
  projectRef: string
  connectionString?: string
  payload: CreateColumnBody
}

export async function createDatabaseColumn({
  projectRef,
  connectionString,
  payload,
}: DatabaseColumnCreateVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await post('/platform/pg-meta/{ref}/columns', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
    },
    body: payload,
    headers,
  })

  if (error) handleError(error)
  return data
}

type DatabaseColumnCreateData = Awaited<ReturnType<typeof createDatabaseColumn>>

export const useDatabaseColumnCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseColumnCreateData, ResponseError, DatabaseColumnCreateVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<DatabaseColumnCreateData, ResponseError, DatabaseColumnCreateVariables>(
    (vars) => createDatabaseColumn(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create database column: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
