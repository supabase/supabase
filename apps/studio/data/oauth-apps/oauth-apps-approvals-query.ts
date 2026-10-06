import { useQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthApprovals, USE_MOCKS } from './mocks'
import type { ListOAuthApprovalsResponse } from './types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

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
  }: UseCustomQueryOptions<OAuthApprovalsData, OAuthApprovalsError, TData> = {}
) =>
  useQuery<OAuthApprovalsData, OAuthApprovalsError, TData>({
    queryKey: oauthAppsKeys.approvals(slug, cursor),
    queryFn: () => getOAuthApprovals({ slug, cursor }),
    enabled: enabled && USE_MOCKS && Boolean(slug),
    ...options,
  })
