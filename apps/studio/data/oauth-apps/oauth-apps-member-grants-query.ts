import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthAppGrants, USE_MOCKS } from './mocks'
import type { ListOrgAppGrantsResponse } from './types'
import type { ResponseError, UseCustomInfiniteQueryOptions } from '@/types'

export type OAuthAppMemberGrantsVariables = {
  slug?: string
  appId?: string
  cursor?: string
}

export type { ListOrgAppGrantsResponse, OAuthGrantItem, OAuthGrantProject } from './types'

export async function getOAuthAppMemberGrants({
  slug,
  appId,
  cursor,
}: OAuthAppMemberGrantsVariables): Promise<ListOrgAppGrantsResponse> {
  if (!slug) throw new Error('Organization slug is required')
  if (!appId) throw new Error('App id is required')
  if (!USE_MOCKS) throw new Error('OAuth app member grants are not yet implemented')

  return getMockOAuthAppGrants(appId, cursor)
}

export type OAuthAppMemberGrantsData = Awaited<ReturnType<typeof getOAuthAppMemberGrants>>
export type OAuthAppMemberGrantsError = ResponseError

export const useOAuthAppMemberGrantsQuery = <TData = OAuthAppMemberGrantsData>(
  { slug, appId, cursor }: OAuthAppMemberGrantsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<
    OAuthAppMemberGrantsData,
    OAuthAppMemberGrantsError,
    InfiniteData<TData>,
    readonly unknown[],
    string | undefined
  > = {}
) =>
  useInfiniteQuery({
    queryKey: oauthAppsKeys.appMemberGrants(slug, appId, cursor),
    queryFn: ({ pageParam }) => getOAuthAppMemberGrants({ slug, appId, cursor: pageParam }),
    initialPageParam: cursor,
    getNextPageParam: (lastPage) => lastPage.pagination.next_cursor,
    enabled: enabled && USE_MOCKS && Boolean(slug) && Boolean(appId),
    ...options,
  })
