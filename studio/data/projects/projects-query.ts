import { QueryClient, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'

import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
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

export function prefetchProjects(client: QueryClient) {
  return client.prefetchQuery(projectKeys.list(), ({ signal }) => getProjects(signal))
}

export function useProjectsPrefetch() {
  const client = useQueryClient()

  return useCallback(() => {
    prefetchProjects(client)
  }, [client])
}

export function useAutoProjectsPrefetch() {
  const prefetch = useProjectsPrefetch()

  const called = useRef<boolean>(false)
  if (called.current === false) {
    called.current = true
    prefetch()
  }
}

export function invalidateProjectsQuery(client: QueryClient) {
  return client.invalidateQueries(projectKeys.list())
}
