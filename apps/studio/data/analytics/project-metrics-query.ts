import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { analyticsKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { UseCustomQueryOptions } from '@/types'

export type ProjectMetricsInterval = '15min' | '1hr' | '3hr' | '1day' | '3day' | '7day'

export type ProjectMetricsVariables = {
  projectRef?: string
  interval?: ProjectMetricsInterval
}

const MetricsRow = z.object({
  timestamp: z.number().int().positive(),
  service: z.enum(['auth', 'db', 'functions', 'realtime', 'storage']),
  time_window: z.enum(['current', 'previous']),
  ok_count: z.number().int().nonnegative(),
  warning_count: z.number().int().nonnegative(),
  error_count: z.number().int().nonnegative(),
})

const MetricsRows = z.array(MetricsRow)

export type ProjectMetricsRow = z.infer<typeof MetricsRow>

export async function getProjectMetrics(
  { projectRef, interval }: ProjectMetricsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!interval) throw new Error('interval is required')

  const { data, error } = await get(
    '/platform/projects/{ref}/analytics/endpoints/project.metrics',
    {
      params: {
        path: { ref: projectRef },
        query: { interval },
      },
      signal,
    }
  )

  if (error) handleError(error)

  const payload = data?.result ?? []
  const parsed = MetricsRows.safeParse(payload)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]
    const errorPath = firstError.path.length > 0 ? ` at path: ${firstError.path.join('.')}` : ''
    throw new Error(`Invalid project metrics response${errorPath}: ${firstError.message}`)
  }

  return parsed.data
}

export type ProjectMetricsData = Awaited<ReturnType<typeof getProjectMetrics>>
export type ProjectMetricsError = unknown

export const useProjectMetricsQuery = <TData = ProjectMetricsData>(
  { projectRef, interval }: ProjectMetricsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ProjectMetricsData, ProjectMetricsError, TData> = {}
) =>
  useQuery<ProjectMetricsData, ProjectMetricsError, TData>({
    queryKey: analyticsKeys.projectMetrics(projectRef, { interval }),
    queryFn: ({ signal }) => getProjectMetrics({ projectRef, interval }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof interval !== 'undefined',
    refetchOnWindowFocus: false,
    ...options,
  })
