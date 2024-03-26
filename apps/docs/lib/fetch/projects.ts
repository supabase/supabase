import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import type { ResponseError } from '~/types/fetch'
import { get } from './fetchWrappers'

const projectKeys = {
  list: () => ['all-projects'] as const,
}

export async function getProjects(signal?: AbortSignal) {
  const { data, error } = await get('/platform/projects', { signal })
  if (error) throw error
  return data
}

export type ProjectsData = Awaited<ReturnType<typeof getProjects>>
type ProjectsError = ResponseError

export function useProjectsQuery<TData = ProjectsData>({
  enabled = true,
  ...options
}: Omit<UseQueryOptions<ProjectsData, ProjectsError, TData>, 'queryKey'> = {}) {
  return useQuery<ProjectsData, ProjectsError, TData>({
    queryKey: projectKeys.list(),
    queryFn: ({ signal }) => getProjects(signal),
    enabled,
    ...options,
  })
}
