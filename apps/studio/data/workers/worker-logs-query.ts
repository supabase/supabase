import { queryOptions } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { z } from 'zod'

import { workersKeys } from './keys'
import type { LogData } from '@/components/interfaces/Settings/Logs/Logs.types'
import { otelTimestampToMicros } from '@/components/interfaces/Settings/Logs/Logs.utils.otel'
import { executeAnalyticsSql } from '@/data/logs/execute-analytics-sql'
import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'
import { analyticsLiteral, safeSql } from '@/data/logs/safe-analytics-sql'
import { IS_PLATFORM } from '@/lib/constants'
import { WORKER_LOG_SOURCES } from '@/lib/constants/workers'

export type WorkerLogStream = keyof typeof WORKER_LOG_SOURCES

export const WORKER_LOG_STREAM_LABEL: Record<WorkerLogStream, string> = {
  requests: 'Invocations',
  output: 'Logs',
  builds: 'Activity',
}

// Both are read from `log_attributes` rather than the endpoint's own `source` column:
// that column is derived from a mapping which does not currently classify worker rows.
const WORKER_NAME_KEY = 'worker'
const STREAM_KEY = 'source'

const LOOKBACK_HOURS = 24
const LOG_LIMIT = 100

const workerLogRowSchema = z.object({
  id: z.string(),
  timestamp: z.union([z.string(), z.number()]),
  severity: z.string().nullish(),
  message: z.string().nullish(),
})

export type WorkerLogsVariables = {
  projectRef?: string
  name?: string
  stream: WorkerLogStream
}

export const workerLogsSql = (name: string, stream: WorkerLogStream) =>
  safeSql`select id, timestamp, severity_text as severity, event_message as message from logs where log_attributes[${analyticsLiteral(WORKER_NAME_KEY)}] = ${analyticsLiteral(name)} and log_attributes[${analyticsLiteral(STREAM_KEY)}] = ${analyticsLiteral(WORKER_LOG_SOURCES[stream])} order by timestamp desc limit ${analyticsLiteral(LOG_LIMIT)}`

export const parseWorkerLogRows = (result: unknown): LogData[] =>
  z
    .array(workerLogRowSchema)
    .parse(result ?? [])
    .map((row) => ({
      id: row.id,
      timestamp: otelTimestampToMicros(row.timestamp),
      event_message: row.message ?? '',
      severity_text: row.severity ?? '',
    }))

async function getWorkerLogs(
  { projectRef, name, stream }: WorkerLogsVariables,
  signal?: AbortSignal
): Promise<LogData[]> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!name) throw new Error('name is required')

  const end = dayjs()
  const start = end.subtract(LOOKBACK_HOURS, 'hour')

  const data = await executeAnalyticsSql({
    projectRef,
    endpoint: logsAllEndpointUrl(true),
    sql: workerLogsSql(name, stream),
    iso_timestamp_start: start.toISOString(),
    iso_timestamp_end: end.toISOString(),
    signal,
  })

  return parseWorkerLogRows(data?.result)
}

export const workerLogsQueryOptions = ({ projectRef, name, stream }: WorkerLogsVariables) =>
  queryOptions({
    queryKey: workersKeys.logs(projectRef, name, stream),
    queryFn: ({ signal }) => getWorkerLogs({ projectRef, name, stream }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined' && typeof name !== 'undefined',
  })
