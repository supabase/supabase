import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { useProjectByRef } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { ResponseError } from 'types'
import { configKeys } from './keys'

export type ProjectApiVariables = {
  projectRef?: string
}

export type AutoApiService = components['schemas']['AutoApiService']

export type ProjectApiResponse = {
  autoApiService: AutoApiService
}

export async function getProjectApi({ projectRef }: ProjectApiVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/props/project/{ref}/api', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ProjectApiData = Awaited<ReturnType<typeof getProjectApi>>
export type ProjectApiError = ResponseError

export const useProjectApiQuery = <TData = ProjectApiData>(
  { projectRef }: ProjectApiVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectApiData, ProjectApiError, TData> = {}
) => {
  return useQuery<ProjectApiData, ProjectApiError, TData>(
    configKeys.api(projectRef),
    ({ signal }) => getProjectApi({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      refetchInterval(data) {
        if (!data) {
          return false
        }

        const { autoApiService } = data as unknown as ProjectApiData

        const apiKeys = autoApiService?.service_api_keys ?? []
        const interval = apiKeys.length === 0 ? 2000 : 0

        return interval
      },
      ...options,
    }
  )
}
