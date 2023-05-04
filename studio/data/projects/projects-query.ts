import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { Project } from 'types'
import { projectKeys } from './keys'

export type ProjectsVariables = {
  ref?: string
}

export async function getProjects(signal?: AbortSignal) {
  const data = await get(`${API_URL}/projects`, { signal })
  if (data.error) throw data.error
  return data as Project[]
}

export type ProjectsData = Awaited<ReturnType<typeof getProjects>>
export type ProjectsError = unknown

export const useProjectsQuery = <TData = ProjectsData>({
  enabled = true,
  ...options
}: UseQueryOptions<ProjectsData, ProjectsError, TData> = {}) =>
  useQuery<ProjectsData, ProjectsError, TData>(
    projectKeys.list(),
    ({ signal }) => getProjects(signal),
    { enabled: enabled, ...options }
  )

export const useProjectsPrefetch = () => {
  const client = useQueryClient()

  return useCallback(() => {
    client.prefetchQuery(projectKeys.list(), ({ signal }) => getProjects(signal))
  }, [])
}
