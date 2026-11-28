import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'

import { get, handleError } from '../fetchers'
import { oauthAppsKeys } from './keys'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomInfiniteQueryOptions } from '@/types'

export type OAuthGrantsVariables = {
  cursor?: string
}

export async function getOAuthGrants({ cursor }: OAuthGrantsVariables = {}) {
  const { data, error } = await get('/platform/profile/oauth/grants', {
    params: { query: { page: { after: cursor } } },
  })

  if (error) handleError(error)
  return data
}

export type OAuthGrantsData = Awaited<ReturnType<typeof getOAuthGrants>>
export type OAuthGrant = OAuthGrantsData['data'][number]
export type OAuthGrantsError = StudioError

export const useOAuthGrantsQuery = <TData = OAuthGrantsData>(
  { cursor }: OAuthGrantsVariables = {},
  options: UseCustomInfiniteQueryOptions<
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
    getNextPageParam: (lastPage) =>
      lastPage.links.next
        ? // The URL second parameter does not matter as we only want to extract the search params
          new URL(lastPage.links.next, 'http://localhost').searchParams.get('page[after]')
        : null,
    ...options,
  })
