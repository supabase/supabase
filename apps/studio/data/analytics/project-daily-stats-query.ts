import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { operations } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { AnalyticsData } from './constants'
import { analyticsKeys } from './keys'

export type ProjectDailyStatsAttribute =
  operations['DailyStatsController_getDailyStats']['parameters']['query']['attribute']

export type ProjectDailyStatsVariables = {
  projectRef?: string
  attribute: ProjectDailyStatsAttribute
  startDate?: string
  endDate?: string
}

export async function getProjectDailyStats(
  { projectRef, attribute, startDate, endDate }: ProjectDailyStatsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')
  if (!attribute) throw new Error('Attribute is required')
  if (!startDate) throw new Error('Start date is required')
  if (!endDate) throw new Error('End date is required')

  const { data, error } = await get('/platform/projects/{ref}/daily-stats', {
    params: {
      path: { ref: projectRef },
      query: {
        attribute,
        startDate,
        endDate,
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data as unknown as AnalyticsData
}

export type ProjectDailyStatsData = Awaited<ReturnType<typeof getProjectDailyStats>>
export type ProjectDailyStatsError = unknown

export const useProjectDailyStatsQuery = <TData = ProjectDailyStatsData>(
  { projectRef, attribute, startDate, endDate }: ProjectDailyStatsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectDailyStatsData, ProjectDailyStatsError, TData> = {}
) =>
  useQuery<ProjectDailyStatsData, ProjectDailyStatsError, TData>(
    analyticsKeys.infraMonitoring(projectRef, {
      attribute,
      startDate,
      endDate,
    }),
    ({ signal }) => getProjectDailyStats({ projectRef, attribute, startDate, endDate }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof attribute !== 'undefined' &&
        typeof startDate !== 'undefined' &&
        typeof endDate !== 'undefined',
      staleTime: 1000 * 60 * 30, // default good for 30m, stats only refresh once a day
      ...options,
    }
  )
