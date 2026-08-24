import { queryOptions } from '@tanstack/react-query'

import { workersKeys } from './keys'
import { executeAnalyticsSql } from '@/data/logs/execute-analytics-sql'
import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'
import { analyticsLiteral, safeSql } from '@/data/logs/safe-analytics-sql'
import { IS_PLATFORM } from '@/lib/constants'

// The three streams the logs endpoint maps `workers_product.logs` onto, keyed by
// its `metadata.source` attribute. `builds` is exposed as `worker_api_logs` even
// though the underlying attribute reads `worker_api_events`.
export const WORKER_LOG_SOURCES = {
  requests: 'worker_ingress_logs',
  output: 'worker_guest_logs',
  builds: 'worker_api_logs',
} as const

export type WorkerLogStream = keyof typeof WORKER_LOG_SOURCES

export const WORKER_LOG_STREAM_LABEL: Record<WorkerLogStream, string> = {
  requests: 'Requests',
  output: 'Output',
  builds: 'Builds',
}

// Which attribute carries the worker name is not confirmed: no `workers_product.logs`
// row has reached the endpoint tagged with a project ref, so there was none to read
// it from. Everything else here is stream-agnostic, so a correction is one string.
const WORKER_NAME_KEY = 'worker_name'

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
  safeSql`select id, timestamp, severity_text as severity, event_message as message from logs where source = ${analyticsLiteral(WORKER_LOG_SOURCES[stream])} and log_attributes[${analyticsLiteral(WORKER_NAME_KEY)}] = ${analyticsLiteral(name)} order by timestamp desc limit ${analyticsLiteral(LOG_LIMIT)}`

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
