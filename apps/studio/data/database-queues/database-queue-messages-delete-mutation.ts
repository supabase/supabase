import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueueMessageDeleteVariables = {
  projectRef: string
  connectionString?: string
  queueName: string
  messageId: number
}

export async function deleteDatabaseQueueMessage({
  projectRef,
  connectionString,
  queueName,
  messageId,
}: DatabaseQueueMessageDeleteVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `SELECT * FROM pgmq.delete('${queueName}', ${messageId})`,
    queryKey: databaseQueuesKeys.create(),
  })

  return result
}

type DatabaseQueueMessageDeleteData = Awaited<ReturnType<typeof deleteDatabaseQueueMessage>>

export const useDatabaseQueueMessageDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    DatabaseQueueMessageDeleteData,
    ResponseError,
    DatabaseQueueMessageDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabaseQueueMessageDeleteData,
    ResponseError,
    DatabaseQueueMessageDeleteVariables
  >((vars) => deleteDatabaseQueueMessage(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef, queueName } = variables
      await queryClient.invalidateQueries(
        databaseQueuesKeys.getMessagesInfinite(projectRef, queueName)
      )
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete database queue message: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
