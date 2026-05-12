import { literal, safeSql } from '@supabase/pg-meta/src/pg-format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { databaseQueuesKeys } from './keys'
import { isQueueNameValid } from '@/components/interfaces/Integrations/Queues/Queues.utils'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type DatabaseQueueMessageSendVariables = {
  projectRef: string
  connectionString?: string | null
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
  if (!isQueueNameValid(queueName)) {
    throw new Error(
      'Invalid queue name: must contain only alphanumeric characters, underscores, and hyphens'
    )
  }

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: safeSql`select * from pgmq.send(${literal(queueName)}, ${literal(payload)}, ${literal(delay)})`,
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
  UseCustomMutationOptions<
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
  >({
    mutationFn: (vars) => sendDatabaseQueueMessage(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, queueName } = variables
      await queryClient.invalidateQueries({
        queryKey: databaseQueuesKeys.getMessagesInfinite(projectRef, queueName),
      })
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
