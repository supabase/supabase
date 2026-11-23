import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'

import { get, handleError } from '../fetchers'
import { oauthAppsKeys } from './keys'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomInfiniteQueryOptions } from '@/types'

export type OAuthAppMemberGrantsVariables = {
  slug?: string
  appId?: string
  cursor?: string
}

export async function getOAuthAppMemberGrants({
  slug,
  appId,
  cursor,
}: OAuthAppMemberGrantsVariables) {
  if (!slug) throw new Error('Organization slug is required')
  if (!appId) throw new Error('App id is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/oauth/approvals/{app_id}/grants',
    {
      params: { path: { slug, app_id: appId }, query: { page: { after: cursor } } },
    }
  )

  if (error) handleError(error)
  return data
}

export type OAuthAppMemberGrantsData = Awaited<ReturnType<typeof getOAuthAppMemberGrants>>
export type OAuthAppMemberGrant = OAuthAppMemberGrantsData['data'][number]
export type OAuthAppMemberGrantsError = StudioError

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
    getNextPageParam: (lastPage) =>
      lastPage.links.next
        ? // The URL second paramater does not matter as we only want to extract the search params
          new URL(lastPage.links.next, 'http://localhost').searchParams.get('page[after]')
        : null,
    enabled: enabled && Boolean(slug) && Boolean(appId),
    ...options,
  })
