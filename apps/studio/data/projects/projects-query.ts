import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { useProfile } from 'lib/profile'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'

type PaginatedProjectsResponse = components['schemas']['ListProjectsPaginatedResponse']
export type ProjectInfo = PaginatedProjectsResponse['projects'][number]

async function getProjects({
  signal,
  headers,
}: {
  signal?: AbortSignal
  headers?: Record<string, string>
}) {
  const { data, error } = await get('/platform/projects', { signal, headers })

  if (error) handleError(error)
  // The /platform/projects endpoint has a v2 which is activated by passing a {version: '2'} header. The v1 API returns
  // all projects while the v2 returns paginated list of projects. Wrapping the v1 API response into a
  // { projects: ProjectInfo[] } is intentional to be forward compatible with the structure of v2 for easier migration.
  return { projects: data }
}

export type ProjectsData = Awaited<ReturnType<typeof getProjects>>
export type ProjectsError = ResponseError

/** @deprecated Use useProjectsInfiniteQuery or useOrgProjectsInfiniteQuery instead as this endpoint is not paginated */
export const useProjectsQuery = <TData = ProjectsData>({
  enabled = true,
  ...options
}: UseQueryOptions<ProjectsData, ProjectsError, TData> = {}) => {
  const { profile } = useProfile()
  return useQuery<ProjectsData, ProjectsError, TData>(
    projectKeys.list(),
    ({ signal }) => getProjects({ signal }),
    {
      enabled: enabled && profile !== undefined,
      staleTime: 30 * 60 * 1000, // 30 minutes
      ...options,
    }
  )
}
