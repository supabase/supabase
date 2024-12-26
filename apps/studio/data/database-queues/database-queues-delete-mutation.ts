import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueueDeleteVariables = {
  projectRef: string
  connectionString?: string
  queueName: string
}

export async function deleteDatabaseQueue({
  projectRef,
  connectionString,
  queueName,
}: DatabaseQueueDeleteVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `select * from pgmq.drop_queue('${queueName}');`,
    queryKey: databaseQueuesKeys.delete(queueName),
  })

  return result
}

type DatabaseQueueDeleteData = Awaited<ReturnType<typeof deleteDatabaseQueue>>

export const useDatabaseQueueDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseQueueDeleteData, ResponseError, DatabaseQueueDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseQueueDeleteData, ResponseError, DatabaseQueueDeleteVariables>(
    (vars) => deleteDatabaseQueue(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseQueuesKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database queue: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
