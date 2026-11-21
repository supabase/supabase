import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomInfiniteQueryOptions } from '@/types'

export type OAuthApprovalsVariables = {
  slug?: string
  cursor?: string
}

export async function getOAuthApprovals({ slug, cursor }: OAuthApprovalsVariables) {
  if (!slug) throw new Error('Organization slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/oauth/approvals', {
    params: { path: { slug }, query: { page: { after: cursor } } },
  })

  if (error) handleError(error)
  return data
}

export type OAuthApprovalsData = Awaited<ReturnType<typeof getOAuthApprovals>>
export type OAuthApproval = OAuthApprovalsData['data'][number]
export type OAuthApprovalTarget = OAuthApproval['attributes']['target']

export type OAuthApprovalsError = StudioError

export const useOAuthApprovalsQuery = <TData = OAuthApprovalsData>(
  { slug, cursor }: OAuthApprovalsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<
    OAuthApprovalsData,
    OAuthApprovalsError,
    InfiniteData<TData>,
    readonly unknown[],
    string | undefined
  > = {}
) =>
  useInfiniteQuery({
    queryKey: oauthAppsKeys.approvals(slug, cursor),
    queryFn: ({ pageParam }) => getOAuthApprovals({ slug, cursor: pageParam }),
    enabled: enabled && Boolean(slug),
    initialPageParam: cursor,
    getNextPageParam: (lastPage) =>
      lastPage.links.next
        ? // The URL second parameter does not matter as we only want to extract the search params
          new URL(lastPage.links.next, 'http://localhost').searchParams.get('page[after]')
        : null,
    ...options,
  })
