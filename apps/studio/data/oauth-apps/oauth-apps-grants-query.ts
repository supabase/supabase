import { useQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthOwnGrants, USE_MOCKS } from './mocks'
import type { ListOwnGrantsResponse } from './types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

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
  }: UseCustomQueryOptions<OAuthGrantsData, OAuthGrantsError, TData> = {}
) =>
  useQuery<OAuthGrantsData, OAuthGrantsError, TData>({
    queryKey: oauthAppsKeys.grants(cursor),
    queryFn: () => getOAuthGrants({ cursor }),
    enabled: enabled && USE_MOCKS,
    ...options,
  })
