import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { NotFoundError } from 'data/utils'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { Project } from 'types'
import { projectKeys } from './keys'

export async function getProjectApi(
  projectRef: string | undefined,
  signal?: AbortSignal
): Promise<{
  // TODO(alaister): add proper typings
  projectApi: unknown
}> {
  if (typeof projectRef === 'undefined') {
    throw new Error('projectRef is required for getContent')
  }

  let response = await get<unknown>(`${API_URL}/props/project/${projectRef}/api`, { signal })

  if (response.error) {
    throw response.error
  }

  if (!response) {
    throw new NotFoundError('Project api not found')
  }

  return {
    projectApi: response,
  }
}

export type ProjectApiData = Awaited<ReturnType<typeof getProjectApi>>
export type ProjectApiError = NotFoundError

export const useProjectApiQuery = <TData = ProjectApiData>(
  projectRef: string | undefined,
  { enabled, ...options }: UseQueryOptions<ProjectApiData, ProjectApiError, TData> = {}
) =>
  useQuery<ProjectApiData, ProjectApiError, TData>(
    projectKeys.api(projectRef),
    ({ signal }) => getProjectApi(projectRef, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export const useProjectApiPrefetch = (projectRef: string | undefined) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(projectKeys.api(projectRef), ({ signal }) =>
        getProjectApi(projectRef, signal)
      )
    }
  }, [])
}
