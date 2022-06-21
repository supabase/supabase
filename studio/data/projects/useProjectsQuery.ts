import { NotFoundError } from 'data/utils'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { useQuery, useQueryClient, UseQueryOptions } from 'react-query'
import { Project } from 'types'
import { projectKeys } from './keys'

export async function getProjects(signal?: AbortSignal): Promise<{
  projects: Project[]
}> {
  let response = await get<Project[]>(`${API_URL}/projects`, { signal })

  if (response.error) {
    throw response.error
  }

  if (!response) {
    throw new NotFoundError('Projects not found')
  }

  return {
    projects: response,
  }
}

export type ProjectsData = Awaited<ReturnType<typeof getProjects>>
export type ProjectsError = NotFoundError

export const useProjectsQuery = <TData = ProjectsData>(
  options?: UseQueryOptions<ProjectsData, ProjectsError, TData>
) =>
  useQuery<ProjectsData, ProjectsError, TData>(
    projectKeys.list(),
    ({ signal }) => getProjects(signal),
    options
  )

export const useProjectsPrefetch = () => {
  const client = useQueryClient()

  return useCallback(() => {
    client.prefetchQuery(projectKeys.list(), ({ signal }) => getProjects(signal))
  }, [])
}
