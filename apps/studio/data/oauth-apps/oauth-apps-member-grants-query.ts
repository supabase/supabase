import { useQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthAppGrants, USE_MOCKS } from './mocks'
import type { ListAppGrantsResponse } from './types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OAuthAppMemberGrantsVariables = {
  slug?: string
  appId?: string
}

export type { ListAppGrantsResponse, OAuthGrantItem } from './types'

export async function getOAuthAppMemberGrants({
  slug,
  appId,
}: OAuthAppMemberGrantsVariables): Promise<ListAppGrantsResponse> {
  if (!slug) throw new Error('Organization slug is required')
  if (!appId) throw new Error('App id is required')
  if (!USE_MOCKS) throw new Error('OAuth app member grants are not yet implemented')

  return getMockOAuthAppGrants(appId)
}

export type OAuthAppMemberGrantsData = Awaited<ReturnType<typeof getOAuthAppMemberGrants>>
export type OAuthAppMemberGrantsError = ResponseError

export const useOAuthAppMemberGrantsQuery = <TData = OAuthAppMemberGrantsData>(
  { slug, appId }: OAuthAppMemberGrantsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OAuthAppMemberGrantsData, OAuthAppMemberGrantsError, TData> = {}
) =>
  useQuery<OAuthAppMemberGrantsData, OAuthAppMemberGrantsError, TData>({
    queryKey: oauthAppsKeys.appMemberGrants(slug, appId),
    queryFn: () => getOAuthAppMemberGrants({ slug, appId }),
    enabled: enabled && USE_MOCKS && Boolean(slug) && Boolean(appId),
    ...options,
  })
