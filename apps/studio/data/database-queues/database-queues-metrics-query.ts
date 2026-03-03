import { useQuery } from '@tanstack/react-query'

import { isQueueNameValid } from 'components/interfaces/Integrations/Queues/Queues.utils'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueuesMetricsVariables = {
  projectRef?: string
  connectionString?: string | null
  queueName: string
}

export type PostgresQueueMetric = {
  queue_name: string
  queue_length: number
  method: 'estimated' | 'precise'
}

const preciseMetricsSqlQuery = (queueName: string) => {
  return `
  set local statement_timeout = '1s';
  SELECT
    COUNT(*) AS row_count
  FROM
    "pgmq"."q_${queueName}";
`
}

const estimateMetricsSqlQuery = (queueName: string) => {
  return `
  select
  reltuples::bigint as estimated_rows
    from
  pg_class
    where
  relname = 'q_${queueName}'
  and relnamespace = 'pgmq'::regnamespace;
`
}

export async function getDatabaseQueuesMetrics({
  projectRef,
  connectionString,
  queueName,
}: DatabaseQueuesMetricsVariables) {
  if (!projectRef) throw new Error('Project ref is required')
  if (!isQueueNameValid(queueName)) {
    throw new Error(
      'Invalid queue name: must contain only alphanumeric characters, underscores, and hyphens'
    )
  }

  try {
    const { result } = await executeSql({
      projectRef,
      connectionString,
      sql: preciseMetricsSqlQuery(queueName),
    })
    return {
      queue_name: queueName,
      queue_length: result[0].row_count,
      method: 'precise',
    } as PostgresQueueMetric
  } catch (error: any) {
    // if the error is caused because the count timeouted, try to fetch an approximate count
    if (error?.message === 'canceling statement due to statement timeout') {
      const { result } = await executeSql({
        projectRef,
        connectionString,
        sql: estimateMetricsSqlQuery(queueName),
      })
      return {
        queue_name: queueName,
        queue_length: result[0].estimated_rows,
        method: 'estimated',
      } as PostgresQueueMetric
    }
    throw error
  }
}

export type DatabaseQueuesMetricsData = PostgresQueueMetric
export type DatabaseQueuesMetricsError = ResponseError

export const useQueuesMetricsQuery = <TData = DatabaseQueuesMetricsData>(
  { projectRef, connectionString, queueName }: DatabaseQueuesMetricsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<DatabaseQueuesMetricsData, DatabaseQueuesMetricsError, TData> = {}
) =>
  useQuery<DatabaseQueuesMetricsData, DatabaseQueuesMetricsError, TData>({
    queryKey: databaseQueuesKeys.metrics(projectRef, queueName),
    queryFn: () => getDatabaseQueuesMetrics({ projectRef, connectionString, queueName }),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
