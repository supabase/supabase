import { ident, literal, safeSql } from '@supabase/pg-meta/src/pg-format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { databaseQueuesKeys } from './keys'
import {
  isQueueNameValid,
  pgmqQueueTable,
} from '@/components/interfaces/Integrations/Queues/Queues.utils'
import { executeSql } from '@/data/sql/execute-sql-query'
import { tableKeys } from '@/data/tables/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type DatabaseQueueCreateVariables = {
  projectRef: string
  connectionString?: string | null
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
  if (!isQueueNameValid(name)) {
    throw new Error(
      'Invalid queue name: must contain only alphanumeric characters, underscores, and hyphens'
    )
  }

  const { partitionInterval, retentionInterval } = configuration ?? {}

  const createFragment =
    type === 'partitioned'
      ? safeSql`select from pgmq.create_partitioned(${literal(name)}, ${literal(partitionInterval)}, ${literal(retentionInterval)});`
      : type === 'unlogged'
        ? safeSql`SELECT pgmq.create_unlogged(${literal(name)});`
        : safeSql`SELECT pgmq.create(${literal(name)});`

  const rlsFragment = enableRls
    ? safeSql` alter table ${ident('pgmq')}.${ident(pgmqQueueTable(name))} enable row level security;`
    : safeSql``

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: safeSql`${createFragment}${rlsFragment}`,
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
  UseCustomMutationOptions<DatabaseQueueCreateData, ResponseError, DatabaseQueueCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseQueueCreateData, ResponseError, DatabaseQueueCreateVariables>({
    mutationFn: (vars) => createDatabaseQueue(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: databaseQueuesKeys.list(projectRef) })
      queryClient.invalidateQueries({ queryKey: tableKeys.list(projectRef, 'pgmq') })
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
  })
}
