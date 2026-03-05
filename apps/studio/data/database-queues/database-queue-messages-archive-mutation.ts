import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { isQueueNameValid } from 'components/interfaces/Integrations/Queues/Queues.utils'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueueMessageArchiveVariables = {
  projectRef: string
  connectionString?: string | null
  queueName: string
  messageId: number
}

export async function archiveDatabaseQueueMessage({
  projectRef,
  connectionString,
  queueName,
  messageId,
}: DatabaseQueueMessageArchiveVariables) {
  if (!isQueueNameValid(queueName)) {
    throw new Error(
      'Invalid queue name: must contain only alphanumeric characters, underscores, and hyphens'
    )
  }
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `SELECT * FROM pgmq.archive('${queueName}', ${messageId})`,
    queryKey: databaseQueuesKeys.create(),
  })

  return result
}

type DatabaseQueueMessageArchiveData = Awaited<ReturnType<typeof archiveDatabaseQueueMessage>>

export const useDatabaseQueueMessageArchiveMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DatabaseQueueMessageArchiveData,
    ResponseError,
    DatabaseQueueMessageArchiveVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabaseQueueMessageArchiveData,
    ResponseError,
    DatabaseQueueMessageArchiveVariables
  >({
    mutationFn: (vars) => archiveDatabaseQueueMessage(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, queueName } = variables
      await queryClient.invalidateQueries({
        queryKey: databaseQueuesKeys.getMessagesInfinite(projectRef, queueName),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to archive database queue message: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
