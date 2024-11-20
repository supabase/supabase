import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueueMessageSendVariables = {
  projectRef: string
  connectionString?: string
  queueName: string
  payload: string
  delay: number
}

export async function sendDatabaseQueueMessage({
  projectRef,
  connectionString,
  queueName,
  payload,
  delay,
}: DatabaseQueueMessageSendVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `select * from pgmq.send( '${queueName}', '${payload}', ${delay})`,
    queryKey: databaseQueuesKeys.create(),
  })

  return result
}

type DatabaseQueueMessageSendData = Awaited<ReturnType<typeof sendDatabaseQueueMessage>>

export const useDatabaseQueueMessageSendMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    DatabaseQueueMessageSendData,
    ResponseError,
    DatabaseQueueMessageSendVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabaseQueueMessageSendData,
    ResponseError,
    DatabaseQueueMessageSendVariables
  >((vars) => sendDatabaseQueueMessage(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef, queueName } = variables
      await queryClient.invalidateQueries(
        databaseQueuesKeys.getMessagesInfinite(projectRef, queueName)
      )
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to send database queue message: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
