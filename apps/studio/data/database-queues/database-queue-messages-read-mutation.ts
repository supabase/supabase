import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { isQueueNameValid } from 'components/interfaces/Integrations/Queues/Queues.utils'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueueMessageReadVariables = {
  projectRef: string
  connectionString?: string | null
  queueName: string
  duration: number
  messageId: number
}

export async function readDatabaseQueueMessage({
  projectRef,
  connectionString,
  queueName,
  messageId,
  duration,
}: DatabaseQueueMessageReadVariables) {
  if (!isQueueNameValid(queueName)) {
    throw new Error(
      'Invalid queue name: must contain only alphanumeric characters, underscores, and hyphens'
    )
  }

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `select * from pgmq.set_vt('${queueName}', ${messageId}, ${duration})`,
    queryKey: databaseQueuesKeys.create(),
  })

  return result
}

type DatabaseQueueMessageReadData = Awaited<ReturnType<typeof readDatabaseQueueMessage>>

export const useDatabaseQueueMessageReadMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DatabaseQueueMessageReadData,
    ResponseError,
    DatabaseQueueMessageReadVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabaseQueueMessageReadData,
    ResponseError,
    DatabaseQueueMessageReadVariables
  >({
    mutationFn: (vars) => readDatabaseQueueMessage(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, queueName } = variables
      await queryClient.invalidateQueries({
        queryKey: databaseQueuesKeys.getMessagesInfinite(projectRef, queueName),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to postpone database queue message: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
