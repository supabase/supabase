import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { useProfile } from 'lib/profile'
import { ResponseError } from 'types'
import { projectKeys } from './keys'

const DEFAULT_LIMIT = 100

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

  if (error) handleError(error)
  return data as unknown as components['schemas']['ListProjectsPaginatedResponse']
}

export type ProjectsInfiniteData = Awaited<ReturnType<typeof getProjects>>
export type ProjectsInfiniteError = ResponseError

export const useProjectsInfiniteQuery = <TData = ProjectsInfiniteData>(
  { limit = DEFAULT_LIMIT, sort = 'name_asc', search }: GetProjectsInfiniteVariables,
  {
    enabled = true,
    ...options
  }: UseInfiniteQueryOptions<ProjectsInfiniteData, ProjectsInfiniteError, TData> = {}
) => {
  const { profile } = useProfile()
  return useInfiniteQuery<ProjectsInfiniteData, ProjectsInfiniteError, TData>(
    projectKeys.infiniteList({ limit, sort, search }),
    ({ signal, pageParam }) => getProjects({ limit, page: pageParam, sort, search }, signal),
    {
      enabled: enabled && profile !== undefined,
      getNextPageParam(lastPage, pages) {
        const page = pages.length
        const currentTotalCount = page * limit
        // @ts-ignore [Joshen] API type issue for Version 2 endpoints
        const totalCount = lastPage.pagination.count

        if (currentTotalCount >= totalCount) return undefined
        return page
      },
      ...options,
    }
  )
}
