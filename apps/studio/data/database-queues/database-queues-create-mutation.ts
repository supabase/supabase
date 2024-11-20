import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueueCreateVariables = {
  projectRef: string
  connectionString?: string
  query: string
}

export async function createDatabaseQueue({
  projectRef,
  connectionString,
  query,
}: DatabaseQueueCreateVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: query,
    queryKey: databaseQueuesKeys.create(),
  })

  return result
}

type DatabaseQueueCreateData = Awaited<ReturnType<typeof createDatabaseQueue>>

export const useDatabaseQueueCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseQueueCreateData, ResponseError, DatabaseQueueCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseQueueCreateData, ResponseError, DatabaseQueueCreateVariables>(
    (vars) => createDatabaseQueue(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseQueuesKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create database queue: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
