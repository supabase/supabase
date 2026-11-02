import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthApprovals, USE_MOCKS } from './mocks'
import type { ListOAuthApprovalsResponse } from './types'
import type { ResponseError, UseCustomInfiniteQueryOptions } from '@/types'

export type OAuthApprovalsVariables = {
  slug?: string
  cursor?: string
}

export type { ListOAuthApprovalsResponse, OAuthApprovalItem } from './types'

export async function getOAuthApprovals({
  slug,
  cursor,
}: OAuthApprovalsVariables): Promise<ListOAuthApprovalsResponse> {
  if (!slug) throw new Error('Organization slug is required')
  if (!USE_MOCKS) throw new Error('OAuth app approvals are not yet implemented')

  return getMockOAuthApprovals(cursor)
}

export type OAuthApprovalsData = Awaited<ReturnType<typeof getOAuthApprovals>>
export type OAuthApprovalsError = ResponseError

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
    enabled: enabled && USE_MOCKS && Boolean(slug),
    initialPageParam: cursor,
    getNextPageParam: (lastPage) => lastPage.pagination.next_cursor,
    ...options,
  })
