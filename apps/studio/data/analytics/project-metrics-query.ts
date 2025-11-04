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
  timestamp: z.number(),
  service: z.enum(['auth', 'db', 'functions', 'realtime', 'storage']),
  time_window: z.enum(['current', 'previous']),
  ok_count: z.number(),
  warning_count: z.number(),
  error_count: z.number(),
})

const MetricsRows = z.array(MetricsRow)

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
    throw new Error('Invalid metrics response')
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


