import { NotFoundError } from 'data/utils'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { useQuery, useQueryClient, UseQueryOptions } from 'react-query'
import { Project } from 'types'
import { projectKeys } from './keys'

export async function getProject(
  projectRef: string | undefined,
  signal?: AbortSignal
): Promise<{
  project: Project
}> {
  if (typeof projectRef === 'undefined') {
    throw new Error('projectRef is required for getContent')
  }

  let response = await get<Project>(`${API_URL}/projects/${projectRef}`, { signal })

  if (response.error) {
    throw response.error
  }

  if (!response) {
    throw new NotFoundError('Project not found')
  }

  return {
    project: response,
  }
}

export type ProjectData = Awaited<ReturnType<typeof getProject>>
export type ProjectError = NotFoundError

export const useProjectQuery = <TData = ProjectData>(
  projectRef: string | undefined,
  { enabled, ...options }: UseQueryOptions<ProjectData, ProjectError, TData> = {}
) =>
  useQuery<ProjectData, ProjectError, TData>(
    projectKeys.detail(projectRef),
    ({ signal }) => getProject(projectRef, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export const useProjectPrefetch = (projectRef: string | undefined) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(projectKeys.detail(projectRef), ({ signal }) =>
        getProject(projectRef, signal)
      )
    }
  }, [])
}
