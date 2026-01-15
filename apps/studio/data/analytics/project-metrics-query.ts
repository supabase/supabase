import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { fetchGet } from 'data/fetchers'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { analyticsKeys } from './keys'
import { UseCustomQueryOptions } from 'types'

export type ProjectMetricsVariables = {
  projectRef?: string
  interval?: '1hr' | '1day' | '7day'
}

const MetricsRow = z.object({
  timestamp: z
    .number({
      required_error: 'Timestamp is required',
      invalid_type_error: 'Timestamp must be a number (microseconds since epoch)',
    })
    .int('Timestamp must be an integer')
    .positive('Timestamp must be positive'),
  service: z.enum(['auth', 'db', 'functions', 'realtime', 'storage'], {
    required_error: 'Service field is required',
    invalid_type_error: 'Service must be one of: auth, db, functions, realtime, storage',
  }),
  time_window: z.enum(['current', 'previous'], {
    required_error: 'Time window field is required',
    invalid_type_error: 'Time window must be either "current" or "previous"',
  }),
  ok_count: z
    .number({
      required_error: 'ok_count is required',
      invalid_type_error: 'ok_count must be a number',
    })
    .int('ok_count must be an integer')
    .nonnegative('ok_count cannot be negative'),
  warning_count: z
    .number({
      required_error: 'warning_count is required',
      invalid_type_error: 'warning_count must be a number',
    })
    .int('warning_count must be an integer')
    .nonnegative('warning_count cannot be negative'),
  error_count: z
    .number({
      required_error: 'error_count is required',
      invalid_type_error: 'error_count must be a number',
    })
    .int('error_count must be an integer')
    .nonnegative('error_count cannot be negative'),
})

const MetricsRows = z.array(MetricsRow, {
  required_error: 'Metrics response must be an array',
  invalid_type_error: 'Metrics response must be an array of metric rows',
})

export type ProjectMetricsRow = z.infer<typeof MetricsRow>

export type ServiceKey = 'db' | 'functions' | 'auth' | 'storage' | 'realtime'

export async function getProjectMetrics(
  { projectRef, interval }: ProjectMetricsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const search = new URLSearchParams()
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

  return parsed.data
}

export type ProjectMetricsData = Awaited<ReturnType<typeof getProjectMetrics>>
export type ProjectMetricsError = unknown

export const useProjectMetricsQuery = <TData = ProjectMetricsData>(
  vars: ProjectMetricsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ProjectMetricsData, ProjectMetricsError, TData> = {}
) => {
  const { projectRef, interval } = vars

  return useQuery<ProjectMetricsData, ProjectMetricsError, TData>({
    queryKey: analyticsKeys.projectMetrics(projectRef, { interval }),
    queryFn: ({ signal }) => getProjectMetrics({ projectRef, interval }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    refetchOnWindowFocus: false,
    ...options,
  })
}
