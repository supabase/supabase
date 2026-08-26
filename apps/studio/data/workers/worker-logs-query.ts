import { queryOptions } from '@tanstack/react-query'

import { workersKeys } from './keys'
import { executeAnalyticsSql } from '@/data/logs/execute-analytics-sql'
import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'
import { analyticsLiteral, safeSql } from '@/data/logs/safe-analytics-sql'
import { IS_PLATFORM } from '@/lib/constants'

// The three streams the workers pipeline emits, as they appear in the `source`
// attribute of every row.
export const WORKER_LOG_SOURCES = {
  requests: 'worker_ingress_logs',
  output: 'worker_guest_logs',
  builds: 'worker_api_logs',
} as const

export type WorkerLogStream = keyof typeof WORKER_LOG_SOURCES

export const WORKER_LOG_STREAM_LABEL: Record<WorkerLogStream, string> = {
  requests: 'Requests',
  output: 'Logs',
  builds: 'Builds',
}

// Both are read from `log_attributes` rather than the endpoint's own `source` column:
// that column is derived from a mapping which does not currently classify worker rows,
// and these attributes are on every row either way.
const WORKER_NAME_KEY = 'worker'
const STREAM_KEY = 'source'

const LOOKBACK_HOURS = 24

const LOG_LIMIT = 100

export interface WorkerLogEntry {
  id: string
  timestamp: string
  severity: string
  message: string
}

export type WorkerLogsVariables = {
  projectRef?: string
  name?: string
  stream: WorkerLogStream
}

export const workerLogsSql = (name: string, stream: WorkerLogStream) =>
  safeSql`select id, timestamp, severity_text as severity, event_message as message from logs where log_attributes[${analyticsLiteral(WORKER_NAME_KEY)}] = ${analyticsLiteral(name)} and log_attributes[${analyticsLiteral(STREAM_KEY)}] = ${analyticsLiteral(WORKER_LOG_SOURCES[stream])} order by timestamp desc limit ${analyticsLiteral(LOG_LIMIT)}`

async function getWorkerLogs(
  { projectRef, name, stream }: WorkerLogsVariables,
  signal?: AbortSignal
): Promise<WorkerLogEntry[]> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!name) throw new Error('name is required')

  const end = new Date()
  const start = new Date(end.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000)

  const data = await executeAnalyticsSql({
    projectRef,
    endpoint: logsAllEndpointUrl(true),
    sql: workerLogsSql(name, stream),
    iso_timestamp_start: start.toISOString(),
    iso_timestamp_end: end.toISOString(),
    signal,
  })

  return (data?.result ?? []) as WorkerLogEntry[]
}

export const workerLogsQueryOptions = ({ projectRef, name, stream }: WorkerLogsVariables) =>
  queryOptions({
    queryKey: workersKeys.logs(projectRef, name, stream),
    queryFn: ({ signal }) => getWorkerLogs({ projectRef, name, stream }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined' && typeof name !== 'undefined',
  })
