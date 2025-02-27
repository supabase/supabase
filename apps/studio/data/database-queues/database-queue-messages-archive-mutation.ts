import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueueMessageArchiveVariables = {
  projectRef: string
  connectionString?: string
  queryName: string
  messageId: number
}

export async function archiveDatabaseQueueMessage({
  projectRef,
  connectionString,
  queryName,
  messageId,
}: DatabaseQueueMessageArchiveVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `SELECT * FROM pgmq.archive('${queryName}', ${messageId})`,
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
  UseMutationOptions<
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
  >((vars) => archiveDatabaseQueueMessage(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef, queryName } = variables
      await queryClient.invalidateQueries(
        databaseQueuesKeys.getMessagesInfinite(projectRef, queryName)
      )
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
