import { InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { platformComponents as components } from 'api-types'
import { useCallback } from 'react'

import { INFINITE_PROJECTS_KEY_PREFIX, projectKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { useProfile } from '@/lib/profile'
import type { ResponseError, UseCustomInfiniteQueryOptions } from '@/types'

/**
 * [Joshen] Try to keep this value a multiple of 6 (common denominator of 2 and 3) to fit the cards
 * view on the project home page, So that the last row will always be a full row of cards while
 * there's a next page. API max rows is 100, I'm just choosing 96 here as the highest value thats a
 * multiple of 6.
 *
 * Also deliberately omitting limit as a param in this RQ hook just so we can consistently use the same
 * cached data and not unnecessarily ping API for different limit values. (Let me know if there happens
 * to be a UI that might need a specific limit value that we need to reintroduce that param)
 */
const DEFAULT_LIMIT = 96

interface GetOrgProjectsInfiniteVariables {
  slug?: string
  sort?: 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc'
  search?: string
  page?: number
  statuses?: string[]
}

export type OrgProjectsResponse = components['schemas']['OrganizationProjectsResponse_Output']
export type OrgProject = OrgProjectsResponse['projects'][number]

export async function getOrganizationProjects(
  {
    slug,
    page = 0,
    sort = 'name_asc',
    search: _search = '',
    statuses: _statuses = [],
  }: GetOrgProjectsInfiniteVariables,
  signal?: AbortSignal,
  headers?: Record<string, string>
) {
  if (!slug) throw new Error('Slug is required')

  const limit = DEFAULT_LIMIT
  const offset = page * limit
  const search = _search.length === 0 ? undefined : _search
  const statuses = _statuses.length === 0 ? undefined : _statuses.join(',')

  const { data, error } = await get('/platform/organizations/{slug}/projects', {
    params: { path: { slug }, query: { limit, offset, sort, search, statuses } },
    signal,
    headers,
  })

  if (error) handleError(error)
  return data
}

export type OrgProjectsInfiniteData = Awaited<ReturnType<typeof getOrganizationProjects>>
export type OrgProjectsInfiniteError = ResponseError

export const useOrgProjectsInfiniteQuery = <TData = OrgProjectsInfiniteData>(
  { slug, sort = 'name_asc', search, statuses = [] }: GetOrgProjectsInfiniteVariables,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<
    OrgProjectsInfiniteData,
    OrgProjectsInfiniteError,
    InfiniteData<TData>,
    readonly unknown[],
    number | undefined
  > = {}
) => {
  const { profile } = useProfile()
  return useInfiniteQuery({
    queryKey: projectKeys.infiniteListByOrg(slug, { sort, search, statuses }),
    queryFn: ({ signal, pageParam }) =>
      getOrganizationProjects({ slug, page: pageParam, sort, search, statuses }, signal),
    enabled: enabled && profile !== undefined && typeof slug !== 'undefined',
    staleTime: 30 * 60 * 1000, // 30 minutes
    initialPageParam: 0,
    getNextPageParam(lastPage, pages) {
      const page = pages.length
      const currentTotalCount = page * DEFAULT_LIMIT
      const totalCount = lastPage.pagination?.count

      if (totalCount === undefined || currentTotalCount >= totalCount) return undefined
      return page
    },
    ...options,
  })
}

export const getComputeSize = (project: OrgProject) => {
  const primaryDatabase = project.databases.find((db) => db.identifier === project.ref)
  return primaryDatabase?.infra_compute_size
}

export const useInvalidateProjectsInfiniteQuery = () => {
  const queryClient = useQueryClient()
  const invalidateProjectsQuery = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: [INFINITE_PROJECTS_KEY_PREFIX] })
  }, [queryClient])
  return { invalidateProjectsQuery }
}
