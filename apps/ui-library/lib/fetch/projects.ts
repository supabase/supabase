import { infiniteQueryOptions } from '@tanstack/react-query'
import { components } from 'api-types'
import { get } from './fetchWrappers'

const DEFAULT_LIMIT = 10
const projectKeys = {
  listInfinite: (params?: {
    limit: number
    sort?: 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc'
    search?: string
  }) => ['all-projects-infinite', params].filter(Boolean),
}

interface GetProjectsInfiniteVariables {
  limit?: number
  sort?: 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc'
  search?: string
  page?: number
}

export type ProjectInfoInfinite =
  components['schemas']['ListProjectsPaginatedResponse']['projects'][number]

async function getProjects(
  {
    limit = DEFAULT_LIMIT,
    page = 0,
    sort = 'name_asc',
    search: _search = '',
  }: GetProjectsInfiniteVariables,
  signal?: AbortSignal,
  headers?: Record<string, string>
) {
  const offset = page * limit
  const search = _search.length === 0 ? undefined : _search

  const { data, error } = await get('/platform/projects', {
    // @ts-ignore [Joshen] API type issue for Version 2 endpoints
    params: { query: { limit, offset, sort, search } },
    signal,
    headers: { ...headers, Version: '2' },
  })

  if (error) throw error
  return data as unknown as components['schemas']['ListProjectsPaginatedResponse']
}

export type ProjectsInfiniteData = Awaited<ReturnType<typeof getProjects>>

export const projectsInfiniteQueryOptions = (
  { limit = DEFAULT_LIMIT, sort = 'name_asc', search }: GetProjectsInfiniteVariables,
  { enabled = true }: { enabled?: boolean } = { enabled: true }
) => {
  return infiniteQueryOptions({
    enabled,
    queryKey: projectKeys.listInfinite({ limit, sort, search }),
    queryFn: ({ signal, pageParam }) =>
      getProjects({ limit, page: pageParam as number, sort, search }, signal),
    initialPageParam: 0,
    getNextPageParam(lastPage, pages) {
      const page = pages.length
      const currentTotalCount = page * limit
      // @ts-ignore [Joshen] API type issue for Version 2 endpoints
      const totalCount = lastPage.pagination.count

      if (currentTotalCount >= totalCount) return undefined
      return page
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function isProjectPaused(project: { status: string } | null): boolean | undefined {
  return !project ? undefined : project.status === 'INACTIVE'
}
