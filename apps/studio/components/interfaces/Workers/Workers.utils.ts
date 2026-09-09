import { RUNTIMES, WORKER_NAME_WORDS, type RuntimeMeta } from './Workers.constants'
import type { Worker, WorkerAccess, WorkerBuildState } from './Workers.types'
import { parseLogsFilterUrlParams } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.filters'
import type {
  QuerySearchParamsType,
  SearchParamsType,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { toQuerySearchParameters } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import {
  WORKER_LOG_SOURCES,
  WORKER_LOG_STREAM_SEARCH_PARAM,
  WORKER_LOG_STREAMS,
  type WorkerLogStream,
} from '@/lib/constants/workers'
import { ResponseError } from '@/types'

export interface WorkerFilters {
  search: string
  state: WorkerBuildState | 'all'
  access: WorkerAccess | 'all'
}

export const filterWorkers = (workers: Worker[], filters: WorkerFilters): Worker[] => {
  const search = filters.search.trim().toLowerCase()
  return workers.filter((worker) => {
    const matchesSearch = worker.name.toLowerCase().includes(search)
    const matchesState = filters.state === 'all' || worker.buildState === filters.state
    const matchesAccess = filters.access === 'all' || worker.access === filters.access
    return matchesSearch && matchesState && matchesAccess
  })
}

export interface Page<T> {
  items: T[]
  currentPage: number
  totalPages: number
  startIndex: number
}

// Clamps the requested page so filtering down to fewer results never strands an empty page.
export const getPage = <T>(items: T[], requestedPage: number, pageSize: number): Page<T> => {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages)
  const startIndex = (currentPage - 1) * pageSize
  return {
    items: items.slice(startIndex, startIndex + pageSize),
    currentPage,
    totalPages,
    startIndex,
  }
}

export const getRuntimeMeta = (runtime: string | undefined): RuntimeMeta | undefined =>
  runtime === undefined ? undefined : RUNTIMES[runtime]

export const formatRuntime = (runtime: string | undefined): string =>
  getRuntimeMeta(runtime)?.label ?? runtime ?? 'Custom'

// The API reports size as e.g. "2gb-1vcpu"; render the parts when they parse, the raw value if not.
export const formatSize = (size: string): string => {
  const match = size.match(/^(\d+)gb-(\d+)vcpu$/)
  if (!match) return size
  return `${match[1]} GB · ${match[2]} vCPU`
}

export const formatResources = (worker: Worker): string =>
  `${formatSize(worker.size)} · ${worker.declaredInstances} inst`

// Suggests a friendly, already-valid starting name so the deploy dialog isn't blank.
export const generateWorkerName = (): string => {
  const word = WORKER_NAME_WORDS[Math.floor(Math.random() * WORKER_NAME_WORDS.length)]
  const number = Math.floor(Math.random() * 900000) + 100000
  return `worker-${word}-${number}`
}

// A project outside the alpha allow-list gets a 404, not a 403.
export const isWorkersUnavailable = (error: Error | null): boolean =>
  error instanceof ResponseError && error.code === 404

// An enrolled project still answers 403 when the caller lacks the workers permission.
export const isWorkersForbidden = (error: Error | null): boolean =>
  error instanceof ResponseError && error.code === 403

// Worker rows in unified logs carry their OTEL attributes as `metadata`; the
// `source` attribute says which of the three streams the row came from.
export const getWorkerLogStream = (
  metadata: Record<string, unknown> | null | undefined
): WorkerLogStream | undefined => {
  const source = metadata?.source
  return WORKER_LOG_STREAMS.find((stream) => WORKER_LOG_SOURCES[stream] === source)
}

// Streams currently shown, read from the boolean view-option params (all on by default).
export const getVisibleWorkerLogStreams = (
  search: Pick<SearchParamsType, 'worker_requests' | 'worker_output' | 'worker_builds'>
): WorkerLogStream[] =>
  WORKER_LOG_STREAMS.filter((stream) => search[WORKER_LOG_STREAM_SEARCH_PARAM[stream]] !== false)

// The worker logs tab is always scoped to one worker: whatever the URL says, the
// query only ever sees the `workers` log type and this worker's rows. Any
// `log_type` / `worker` filters coming from the URL are dropped so they can't
// widen (or duplicate) that scope.
export const buildWorkerLogsSearchParameters = (
  search: SearchParamsType,
  workerName: string
): QuerySearchParamsType => {
  const parameters = toQuerySearchParameters(search)
  const otherFilters = (parameters.filter ?? []).filter((raw) => {
    const parsed = parseLogsFilterUrlParams([raw])[0]
    return parsed !== undefined && parsed.column !== 'log_type' && parsed.column !== 'worker'
  })
  return {
    ...parameters,
    filter: [...otherFilters, 'log_type:eq:workers', `worker:eq:${workerName}`],
  }
}
