import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { last } from 'lodash'

import { isQueueNameValid } from 'components/interfaces/Integrations/Queues/Queues.utils'
import { QUEUE_MESSAGE_TYPE } from 'components/interfaces/Integrations/Queues/SingleQueue/Queue.utils'
import { executeSql } from 'data/sql/execute-sql-query'
import { DATE_FORMAT } from 'lib/constants'
import type { ResponseError, UseCustomInfiniteQueryOptions } from 'types'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueueVariables = {
  projectRef?: string
  connectionString?: string | null
  queueName: string
  status: QUEUE_MESSAGE_TYPE[]
}

export type PostgresQueueMessage = {
  msg_id: number
  read_ct: number
  enqueued_at: string
  archived_at: string
  vt: Date
  message: Record<string, never>
}

export const QUEUE_MESSAGES_PAGE_SIZE = 30

export async function getDatabaseQueue({
  projectRef,
  connectionString,
  queueName,
  afterTimestamp,
  status,
}: DatabaseQueueVariables & { afterTimestamp: string | undefined }) {
  if (!projectRef) throw new Error('Project ref is required')
  if (!isQueueNameValid(queueName)) {
    throw new Error(
      'Invalid queue name: must contain only alphanumeric characters, underscores, and hyphens'
    )
  }

  if (status.length === 0) {
    return []
  }

  // handles when scheduled and available are deselected
  let queueQuery = ``
  if (status.includes('available') && status.includes('scheduled')) {
    queueQuery = `SELECT msg_id, enqueued_at, read_ct, vt, message, NULL as archived_at FROM "pgmq"."q_${queueName}"`
  } else if (status.includes('available') && !status.includes('scheduled')) {
    queueQuery = `SELECT msg_id, enqueued_at, read_ct, vt, message, NULL as archived_at FROM "pgmq"."q_${queueName}" WHERE vt < '${dayjs(new Date()).format(DATE_FORMAT)}'`
  } else if (!status.includes('available') && status.includes('scheduled')) {
    queueQuery = `SELECT msg_id, enqueued_at, read_ct, vt, message, NULL as archived_at FROM "pgmq"."q_${queueName}" WHERE vt > '${dayjs(new Date()).format(DATE_FORMAT)}'`
  }

  let archivedQuery = ``
  if (status.includes('archived')) {
    archivedQuery = `SELECT msg_id, enqueued_at, read_ct, vt, message, archived_at FROM "pgmq"."a_${queueName}"`
  }

  let query = `SELECT
      *
    FROM
      (
        ${[queueQuery, archivedQuery].filter(Boolean).join(' UNION ALL ')}
      ) AS combined`
  if (afterTimestamp) {
    query += ` WHERE enqueued_at > '${afterTimestamp}'`
  }

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `${query} order by enqueued_at LIMIT ${QUEUE_MESSAGES_PAGE_SIZE}`,
  })
  return result as DatabaseQueueData
}

export type DatabaseQueueData = PostgresQueueMessage[]
export type DatabaseQueueError = ResponseError

export const useQueueMessagesInfiniteQuery = <TData = DatabaseQueueData>(
  { projectRef, connectionString, queueName, status }: DatabaseQueueVariables,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<
    DatabaseQueueData,
    DatabaseQueueError,
    InfiniteData<TData>,
    readonly unknown[],
    string | undefined
  > = {}
) =>
  useInfiniteQuery({
    queryKey: databaseQueuesKeys.getMessagesInfinite(projectRef, queueName, { status }),
    queryFn: ({ pageParam }) => {
      return getDatabaseQueue({
        projectRef,
        connectionString,
        queueName,
        afterTimestamp: pageParam,
        status,
      })
    },
    staleTime: 0,
    enabled: enabled && typeof projectRef !== 'undefined',
    initialPageParam: undefined,
    getNextPageParam(lastPage) {
      const hasNextPage = lastPage.length <= QUEUE_MESSAGES_PAGE_SIZE
      if (!hasNextPage) return undefined
      return last(lastPage)?.enqueued_at
    },
    ...options,
  })
