import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'
import { tableKeys } from 'data/tables/keys'

export type DatabaseQueueCreateVariables = {
  projectRef: string
  connectionString?: string
  name: string
  type: 'basic' | 'partitioned' | 'unlogged'
  enableRls: boolean
  configuration?: {
    partitionInterval?: number
    retentionInterval?: number
  }
}

export async function createDatabaseQueue({
  projectRef,
  connectionString,
  name,
  type,
  enableRls,
  configuration,
}: DatabaseQueueCreateVariables) {
  const { partitionInterval, retentionInterval } = configuration ?? {}

  const query =
    type === 'partitioned'
      ? `select from pgmq.create_partitioned('${name}', '${partitionInterval}', '${retentionInterval}');`
      : type === 'unlogged'
        ? `SELECT pgmq.create_unlogged('${name}');`
        : `SELECT pgmq.create('${name}');`

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `${query} ${enableRls ? `alter table pgmq."q_${name}" enable row level security;` : ''}`.trim(),
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
        queryClient.invalidateQueries(tableKeys.list(projectRef, 'pgmq'))
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
