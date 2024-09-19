import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { tableKeys } from './keys'

export type CreateTableBody = components['schemas']['CreateTableBody']

export type TableCreateVariables = {
  projectRef: string
  connectionString?: string
  // the schema is required field
  payload: CreateTableBody & { schema: string }
}

export async function createTable({ projectRef, connectionString, payload }: TableCreateVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await post('/platform/pg-meta/{ref}/tables', {
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

type TableCreateData = Awaited<ReturnType<typeof createTable>>

export const useTableCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TableCreateData, ResponseError, TableCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableCreateData, ResponseError, TableCreateVariables>(
    (vars) => createTable(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, payload } = variables

        await Promise.all([
          queryClient.invalidateQueries(tableKeys.list(projectRef, payload.schema, true)),
          queryClient.invalidateQueries(tableKeys.list(projectRef, payload.schema, false)),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create database table: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
