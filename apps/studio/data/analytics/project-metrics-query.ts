import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { fetchGet } from 'data/fetchers'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { analyticsKeys } from './keys'

export type ProjectMetricsVariables = {
  projectRef?: string
  isoTimestampStart: string
  isoTimestampEnd: string
  interval?: '1hr' | '1day' | '7day'
}

const MetricsRow = z.object({
  timestamp: z.number({
    required_error: 'Timestamp is required',
    invalid_type_error: 'Timestamp must be a number (microseconds since epoch)',
  }).int('Timestamp must be an integer')
    .positive('Timestamp must be positive'),
  service: z.enum(['auth', 'db', 'functions', 'realtime', 'storage'], {
    required_error: 'Service field is required',
    invalid_type_error: 'Service must be one of: auth, db, functions, realtime, storage',
  }),
  time_window: z.enum(['current', 'previous'], {
    required_error: 'Time window field is required',
    invalid_type_error: 'Time window must be either "current" or "previous"',
  }),
  ok_count: z.number({
    required_error: 'ok_count is required',
    invalid_type_error: 'ok_count must be a number',
  }).int('ok_count must be an integer')
    .nonnegative('ok_count cannot be negative'),
  warning_count: z.number({
    required_error: 'warning_count is required',
    invalid_type_error: 'warning_count must be a number',
  }).int('warning_count must be an integer')
    .nonnegative('warning_count cannot be negative'),
  error_count: z.number({
    required_error: 'error_count is required',
    invalid_type_error: 'error_count must be a number',
  }).int('error_count must be an integer')
    .nonnegative('error_count cannot be negative'),
})

const MetricsRows = z.array(MetricsRow, {
  required_error: 'Metrics response must be an array',
  invalid_type_error: 'Metrics response must be an array of metric rows',
})

export type ProjectMetricsRow = z.infer<typeof MetricsRow>

export type LogsBarChartDatum = {
  timestamp: string
  ok_count: number
  warning_count: number
  error_count: number
}

export type ServiceKey = 'db' | 'functions' | 'auth' | 'storage' | 'realtime'

export type ProjectMetricsByService = Record<
  ServiceKey,
  { current: LogsBarChartDatum[]; previous: LogsBarChartDatum[] }
>

function microsecondsToIso(microseconds: number): string {
  return new Date(microseconds / 1000).toISOString()
}

export async function getProjectMetrics(
  { projectRef, isoTimestampStart, isoTimestampEnd, interval }: ProjectMetricsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const search = new URLSearchParams()
  search.set('iso_timestamp_start', isoTimestampStart)
  search.set('iso_timestamp_end', isoTimestampEnd)
  if (interval) search.set('interval', interval)

  const url = IS_PLATFORM
    ? `${API_URL}/projects/${projectRef}/analytics/endpoints/project.metrics?${search.toString()}`
    : `/api/platform/projects/${projectRef}/analytics/endpoints/project.metrics?${search.toString()}`

  const response = await fetchGet<ProjectMetricsRow[] | { result: ProjectMetricsRow[] }>(url, {
    abortSignal: signal,
  })
  if (response instanceof Error || (response as any)?.error) {
    // normalize to throw
    throw (response as any).error ?? response
  }

  const payload = Array.isArray(response) ? response : (response as any)?.result
  const parsed = MetricsRows.safeParse(payload)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]
    const errorPath = firstError.path.length > 0 ? ` at path: ${firstError.path.join('.')}` : ''
    throw new Error(
      `Invalid metrics response${errorPath}: ${firstError.message}. Received: ${JSON.stringify(payload?.slice(0, 2))}`
    )
  }

  const rows = parsed.data

  const empty: ProjectMetricsByService[ServiceKey] = {
    current: [],
    previous: [],
  }

  const grouped: ProjectMetricsByService = {
    db: { ...empty, current: [], previous: [] },
    functions: { ...empty, current: [], previous: [] },
    auth: { ...empty, current: [], previous: [] },
    storage: { ...empty, current: [], previous: [] },
    realtime: { ...empty, current: [], previous: [] },
  }

  for (const r of rows) {
    const service = (r.service === 'db' ? 'db' : r.service) as ServiceKey
    const datum: LogsBarChartDatum = {
      timestamp: microsecondsToIso(r.timestamp),
      ok_count: r.ok_count,
      warning_count: r.warning_count,
      error_count: r.error_count,
    }
    const bucket = grouped[service]
    if (r.time_window === 'current') {
      bucket.current.push(datum)
    } else {
      bucket.previous.push(datum)
    }
  }

  // sort time series ascending by timestamp for stability
  const byTime = (a: LogsBarChartDatum, b: LogsBarChartDatum) =>
    a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0
  for (const key of Object.keys(grouped) as ServiceKey[]) {
    grouped[key].current.sort(byTime)
    grouped[key].previous.sort(byTime)
  }

  return grouped
}

export type ProjectMetricsData = Awaited<ReturnType<typeof getProjectMetrics>>
export type ProjectMetricsError = unknown

export const useProjectMetricsQuery = <TData = ProjectMetricsData>(
  vars: ProjectMetricsVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectMetricsData, ProjectMetricsError, TData> = {}
) => {
  const { projectRef, isoTimestampStart, isoTimestampEnd, interval } = vars

  return useQuery<ProjectMetricsData, ProjectMetricsError, TData>({
    queryKey: analyticsKeys.projectMetrics(projectRef, {
      startDate: isoTimestampStart,
      endDate: isoTimestampEnd,
      interval,
    }),
    queryFn: ({ signal }) =>
      getProjectMetrics({ projectRef, isoTimestampStart, isoTimestampEnd, interval }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    refetchOnWindowFocus: false,
    ...options,
  })
}


