import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { useProfile } from 'lib/profile'
import { ResponseError } from 'types'
import { projectKeys } from './keys'

const DEFAULT_LIMIT = 11

interface GetOrgProjectsInfiniteVariables {
  slug?: string
  limit?: number
  sort?: 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc'
  search?: string
  page?: number
}

export type OrgProject = components['schemas']['OrganizationProjectsResponse']['projects'][number]

async function getOrganizationProjects(
  {
    slug,
    limit = DEFAULT_LIMIT,
    page = 0,
    sort = 'name_asc',
    search,
  }: GetOrgProjectsInfiniteVariables,
  signal?: AbortSignal,
  headers?: Record<string, string>
) {
  if (!slug) throw new Error('Slug is required')

  const offset = page * limit
  const { data, error } = await get('/platform/organizations/{slug}/projects', {
    params: { path: { slug }, query: { limit, offset, sort, search } },
    signal,
    headers,
  })

  if (error) handleError(error)
  return data
}

export type OrgProjectsInfiniteData = Awaited<ReturnType<typeof getOrganizationProjects>>
export type OrgProjectsInfiniteError = ResponseError

export const useOrgProjectsInfiniteQuery = <TData = OrgProjectsInfiniteData>(
  { slug, limit = DEFAULT_LIMIT, sort, search }: GetOrgProjectsInfiniteVariables,
  {
    enabled = true,
    ...options
  }: UseInfiniteQueryOptions<OrgProjectsInfiniteData, OrgProjectsInfiniteError, TData> = {}
) => {
  const { profile } = useProfile()
  return useInfiniteQuery<OrgProjectsInfiniteData, OrgProjectsInfiniteError, TData>(
    projectKeys.infiniteListByOrg(slug, { limit, sort, search }),
    ({ signal, pageParam }) =>
      getOrganizationProjects({ slug, limit, page: pageParam, sort, search }, signal),
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
