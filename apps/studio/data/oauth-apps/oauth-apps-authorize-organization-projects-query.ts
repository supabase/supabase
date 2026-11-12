import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthAppsAuthorizeOrganizationProjects, USE_MOCKS } from './mocks'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomInfiniteQueryOptions } from '@/types'

export type OAuthAppsAuthorizeOrganizationProjectsVariables = {
  slug?: string | null
  sort?: 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc'
  search?: string
  page?: number
  statuses?: string[]
}

export type { OAuthAppsAuthorizeOrganizationProject } from './types'

export async function getOAuthAppsAuthorizeOrganizationProjects({
  slug,
}: OAuthAppsAuthorizeOrganizationProjectsVariables) {
  if (!slug) throw new Error('Organization slug is required')
  if (!USE_MOCKS)
    throw new Error('OAuth app authorization organization projects are not yet implemented')

  const data = getMockOAuthAppsAuthorizeOrganizationProjects(slug)
  return {
    projects: data,
    pagination: {
      count: data.length,
      limit: 20,
      offset: 0,
    },
  }
}

export type OAuthAppsAuthorizeOrganizationProjectsData = Awaited<
  ReturnType<typeof getOAuthAppsAuthorizeOrganizationProjects>
>
export type OAuthAppsAuthorizeOrganizationProjectsError = StudioError

export const useOAuthAppsAuthorizeOrganizationProjectsQuery = <
  TData = OAuthAppsAuthorizeOrganizationProjectsData,
>(
  {
    slug,
    sort = 'name_asc',
    search,
    statuses = [],
  }: OAuthAppsAuthorizeOrganizationProjectsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<
    OAuthAppsAuthorizeOrganizationProjectsData,
    OAuthAppsAuthorizeOrganizationProjectsError,
    InfiniteData<TData>,
    readonly unknown[],
    number | undefined
  > = {}
) =>
  useInfiniteQuery({
    queryKey: oauthAppsKeys.authorizeOrganizationProjects(slug, { sort, search, statuses }),
    queryFn: () => getOAuthAppsAuthorizeOrganizationProjects({ slug, sort, search, statuses }),
    enabled: enabled && Boolean(slug),
    initialPageParam: 0,
    placeholderData: (previousData) => previousData,
    getNextPageParam() {
      return undefined
    },
    ...options,
  })
