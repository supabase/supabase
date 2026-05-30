import { ident, literal, safeSql, type SafeSqlFragment } from '@supabase/pg-meta/src/pg-format'
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { last } from 'lodash'

import { databaseQueuesKeys } from './keys'
import {
  isQueueNameValid,
  pgmqArchiveTable,
  pgmqQueueTable,
} from '@/components/interfaces/Integrations/Queues/Queues.utils'
import { QUEUE_MESSAGE_TYPE } from '@/components/interfaces/Integrations/Queues/SingleQueue/Queue.utils'
import { executeSql } from '@/data/sql/execute-sql-query'
import { DATE_FORMAT } from '@/lib/constants'
import type { ResponseError, UseCustomInfiniteQueryOptions } from '@/types'

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
  const queueTable = safeSql`${ident('pgmq')}.${ident(pgmqQueueTable(queueName))}`
  const archivedTable = safeSql`${ident('pgmq')}.${ident(pgmqArchiveTable(queueName))}`
  const nowLiteral = literal(dayjs(new Date()).format(DATE_FORMAT))

  let queueQuery: SafeSqlFragment | null = null
  if (status.includes('available') && status.includes('scheduled')) {
    queueQuery = safeSql`SELECT msg_id, enqueued_at, read_ct, vt, message, NULL as archived_at FROM ${queueTable}`
  } else if (status.includes('available') && !status.includes('scheduled')) {
    queueQuery = safeSql`SELECT msg_id, enqueued_at, read_ct, vt, message, NULL as archived_at FROM ${queueTable} WHERE vt < ${nowLiteral}`
  } else if (!status.includes('available') && status.includes('scheduled')) {
    queueQuery = safeSql`SELECT msg_id, enqueued_at, read_ct, vt, message, NULL as archived_at FROM ${queueTable} WHERE vt > ${nowLiteral}`
  }

  const archivedQuery = status.includes('archived')
    ? safeSql`SELECT msg_id, enqueued_at, read_ct, vt, message, archived_at FROM ${archivedTable}`
    : null

  const unionParts = [queueQuery, archivedQuery].filter(
    (part): part is SafeSqlFragment => part !== null
  )
  const unionFragment = unionParts.reduce(
    (acc, part, index) => (index === 0 ? part : safeSql`${acc} UNION ALL ${part}`),
    safeSql``
  )

  const whereClause = afterTimestamp
    ? safeSql` WHERE enqueued_at > ${literal(afterTimestamp)}`
    : safeSql``

  const sql = safeSql`SELECT
      *
    FROM
      (
        ${unionFragment}
      ) AS combined${whereClause} order by enqueued_at LIMIT ${literal(QUEUE_MESSAGES_PAGE_SIZE)}`

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
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
      const hasNextPage = lastPage.length >= QUEUE_MESSAGES_PAGE_SIZE
      if (!hasNextPage) return undefined
      return last(lastPage)?.enqueued_at
    },
    ...options,
  })
