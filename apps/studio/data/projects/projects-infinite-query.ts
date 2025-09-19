import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { useProfile } from 'lib/profile'
import { ResponseError } from 'types'
import { projectKeys } from './keys'

// [Joshen] Try to keep this value a multiple of 6 (common denominator of 2 and 3) to fit the cards view
// So that the last row will always be a full row of cards while there's a next page
// API max rows is 100, I'm just choosing 96 here as the highest value thats a multiple of 6
const DEFAULT_LIMIT = 96

interface GetOrgProjectsInfiniteVariables {
  slug?: string
  limit?: number
  sort?: 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc'
  search?: string
  page?: number
  statuses?: string[]
}

export type OrgProject = components['schemas']['OrganizationProjectsResponse']['projects'][number]

async function getOrganizationProjects(
  {
    slug,
    limit = DEFAULT_LIMIT,
    page = 0,
    sort = 'name_asc',
    search: _search = '',
    statuses: _statuses = [],
  }: GetOrgProjectsInfiniteVariables,
  signal?: AbortSignal,
  headers?: Record<string, string>
) {
  if (!slug) throw new Error('Slug is required')

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
  {
    slug,
    limit = DEFAULT_LIMIT,
    sort = 'name_asc',
    search,
    statuses = [],
  }: GetOrgProjectsInfiniteVariables,
  {
    enabled = true,
    ...options
  }: UseInfiniteQueryOptions<OrgProjectsInfiniteData, OrgProjectsInfiniteError, TData> = {}
) => {
  const { profile } = useProfile()
  return useInfiniteQuery<OrgProjectsInfiniteData, OrgProjectsInfiniteError, TData>(
    projectKeys.infiniteListByOrg(slug, { limit, sort, search, statuses }),
    ({ signal, pageParam }) =>
      getOrganizationProjects({ slug, limit, page: pageParam, sort, search, statuses }, signal),
    {
      enabled: enabled && profile !== undefined && typeof slug !== 'undefined',
      getNextPageParam(lastPage, pages) {
        const page = pages.length
        const currentTotalCount = page * limit
        const totalCount = lastPage.pagination.count

        if (currentTotalCount >= totalCount) return undefined
        return page
      },
      ...options,
    }
  )
}
