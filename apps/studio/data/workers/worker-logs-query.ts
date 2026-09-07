import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { workersKeys } from './keys'
import type { LogData } from '@/components/interfaces/Settings/Logs/Logs.types'
import { otelTimestampToMicros } from '@/components/interfaces/Settings/Logs/Logs.utils.otel'
import { executeAnalyticsSql } from '@/data/logs/execute-analytics-sql'
import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'
import { analyticsLiteral, safeSql } from '@/data/logs/safe-analytics-sql'
import { IS_PLATFORM } from '@/lib/constants'

export const WORKER_LOG_SOURCES = {
  requests: 'worker_ingress_logs',
  output: 'worker_guest_logs',
  builds: 'worker_api_logs',
} as const

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
  iso_timestamp_start: string
  iso_timestamp_end: string
  message?: string
}

export const workerLogsSql = (
  name: string,
  stream: WorkerLogStream,
  { message }: Pick<WorkerLogsVariables, 'message'> = {}
) => {
  const messageFilter = message
    ? safeSql` and event_message ilike ${analyticsLiteral(`%${message}%`)}`
    : safeSql``

  return safeSql`select id, timestamp, severity_text as severity, event_message as message from logs where log_attributes[${analyticsLiteral(WORKER_NAME_KEY)}] = ${analyticsLiteral(name)} and log_attributes[${analyticsLiteral(STREAM_KEY)}] = ${analyticsLiteral(WORKER_LOG_SOURCES[stream])}${messageFilter} order by timestamp desc limit ${analyticsLiteral(LOG_LIMIT)}`
}

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
  {
    projectRef,
    name,
    stream,
    iso_timestamp_start,
    iso_timestamp_end,
    message,
  }: WorkerLogsVariables,
  signal?: AbortSignal
): Promise<LogData[]> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!name) throw new Error('name is required')

  const data = await executeAnalyticsSql({
    projectRef,
    endpoint: logsAllEndpointUrl(true),
    sql: workerLogsSql(name, stream, { message }),
    iso_timestamp_start,
    iso_timestamp_end,
    signal,
  })

  return parseWorkerLogRows(data?.result)
}

export const workerLogsQueryOptions = (variables: WorkerLogsVariables) => {
  const { projectRef, name, stream, iso_timestamp_start, iso_timestamp_end } = variables
  const message = variables.message?.trim() || undefined

  return queryOptions({
    queryKey: workersKeys.logs(projectRef, name, stream, {
      iso_timestamp_start,
      iso_timestamp_end,
      message,
    }),
    queryFn: ({ signal }) =>
      getWorkerLogs(
        { projectRef, name, stream, iso_timestamp_start, iso_timestamp_end, message },
        signal
      ),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined' && typeof name !== 'undefined',
  })
}
