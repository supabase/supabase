import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueuePurgeVariables = {
  projectRef: string
  connectionString?: string
  queueName: string
}

export async function purgeDatabaseQueue({
  projectRef,
  connectionString,
  queueName,
}: DatabaseQueuePurgeVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `select * from pgmq.purge_queue('${queueName}');`,
    queryKey: databaseQueuesKeys.purge(queueName),
  })

  return result
}

type DatabaseQueuePurgeData = Awaited<ReturnType<typeof purgeDatabaseQueue>>

export const useDatabaseQueuePurgeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseQueuePurgeData, ResponseError, DatabaseQueuePurgeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseQueuePurgeData, ResponseError, DatabaseQueuePurgeVariables>(
    (vars) => purgeDatabaseQueue(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, queueName } = variables
        await queryClient.invalidateQueries(
          databaseQueuesKeys.getMessagesInfinite(projectRef, queueName)
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to purge database queue: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
