import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthOwnGrants, USE_MOCKS } from './mocks'
import type { ListOwnGrantsResponse } from './types'
import type { ResponseError, UseCustomInfiniteQueryOptions } from '@/types'

export type OAuthGrantsVariables = {
  cursor?: string
}

export type { ListOwnGrantsResponse, MemberOauthGrantItem, OAuthGrantProject } from './types'

export async function getOAuthGrants({
  cursor,
}: OAuthGrantsVariables = {}): Promise<ListOwnGrantsResponse> {
  if (!USE_MOCKS) throw new Error('OAuth grants are not yet implemented')

  return getMockOAuthOwnGrants(cursor)
}

export type OAuthGrantsData = Awaited<ReturnType<typeof getOAuthGrants>>
export type OAuthGrantsError = ResponseError

export const useOAuthGrantsQuery = <TData = OAuthGrantsData>(
  { cursor }: OAuthGrantsVariables = {},
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<
    OAuthGrantsData,
    OAuthGrantsError,
    InfiniteData<TData>,
    readonly unknown[],
    string | undefined
  > = {}
) =>
  useInfiniteQuery({
    queryKey: oauthAppsKeys.grants(cursor),
    queryFn: ({ pageParam }) => getOAuthGrants({ cursor: pageParam }),
    initialPageParam: cursor,
    getNextPageParam: (lastPage) => lastPage.pagination.next_cursor,
    enabled: enabled && USE_MOCKS,
    ...options,
  })
