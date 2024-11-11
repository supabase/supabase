import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueuesMetricsVariables = {
  projectRef?: string
  connectionString?: string
}

export type PostgresQueueMetric = {
  queue_name: string
  queue_length: number
  newest_msg_age_sec: number | null
  oldest_msg_age_sec: number | null
  total_messages: number
  scrape_time: Date
}

const queuesMetricsSqlQuery = `select * from pgmq.metrics_all();`

export async function getDatabaseQueuesMetrics({
  projectRef,
  connectionString,
}: DatabaseQueuesMetricsVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: queuesMetricsSqlQuery,
  })
  return result
}

export type DatabaseQueuesMetricsData = PostgresQueueMetric[]
export type DatabaseQueuesMetricsError = ResponseError

export const useQueuesMetricsQuery = <TData = DatabaseQueuesMetricsData>(
  { projectRef, connectionString }: DatabaseQueuesMetricsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseQueuesMetricsData, DatabaseQueuesMetricsError, TData> = {}
) =>
  useQuery<DatabaseQueuesMetricsData, DatabaseQueuesMetricsError, TData>(
    databaseQueuesKeys.metrics(projectRef),
    () => getDatabaseQueuesMetrics({ projectRef, connectionString }),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
