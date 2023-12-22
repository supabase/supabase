import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { del } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseColumnsKeys } from './keys'

export type DatabaseColumnDeleteVariables = {
  projectRef: string
  connectionString?: string
  id: string
  cascade?: boolean
}

export async function deleteDatabaseColumn({
  projectRef,
  connectionString,
  id,
  cascade = false,
}: DatabaseColumnDeleteVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await del('/platform/pg-meta/{ref}/columns', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      // cascade is expected to be a string 'true' or 'false'
      query: { id, cascade: cascade.toString() },
    },
    headers,
  })

  if (error) throw error
  return data
}

type DatabaseColumnDeleteData = Awaited<ReturnType<typeof deleteDatabaseColumn>>

export const useDatabaseColumnDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseColumnDeleteData, ResponseError, DatabaseColumnDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseColumnDeleteData, ResponseError, DatabaseColumnDeleteVariables>(
    (vars) => deleteDatabaseColumn(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseColumnsKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database column: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
