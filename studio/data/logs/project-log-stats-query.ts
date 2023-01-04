import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { logKeys } from './keys'

export type ProjectLogStatsVariables = {
  projectRef?: string
  interval?: string
}

export type ProjectLogStatsResponse = any

export async function getProjectLogStats(
  { projectRef, interval }: ProjectLogStatsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }
  if (!interval) {
    throw new Error('interval is required')
  }

  const response = await get(`${API_URL}/projects/${projectRef}/log-stats?interval=${interval}`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as ProjectLogStatsResponse
}

export type ProjectLogStatsData = Awaited<ReturnType<typeof getProjectLogStats>>
export type ProjectLogStatsError = unknown

export const useProjectLogStatsQuery = <TData = ProjectLogStatsData>(
  { projectRef, interval }: ProjectLogStatsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectLogStatsData, ProjectLogStatsError, TData> = {}
) =>
  useQuery<ProjectLogStatsData, ProjectLogStatsError, TData>(
    logKeys.logStats(projectRef, interval),
    ({ signal }) => getProjectLogStats({ projectRef, interval }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof interval !== 'undefined',
      ...options,
    }
  )

export const useProjectLogStatsPrefetch = ({ projectRef, interval }: ProjectLogStatsVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef && interval) {
      client.prefetchQuery(logKeys.logStats(projectRef, interval), ({ signal }) =>
        getProjectLogStats({ projectRef, interval }, signal)
      )
    }
  }, [projectRef, interval])
}
