import { useQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthAppGrants, USE_MOCKS } from './mocks'
import type { ListOrgAppGrantsResponse } from './types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

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
  }: UseCustomQueryOptions<OAuthAppMemberGrantsData, OAuthAppMemberGrantsError, TData> = {}
) =>
  useQuery<OAuthAppMemberGrantsData, OAuthAppMemberGrantsError, TData>({
    queryKey: oauthAppsKeys.appMemberGrants(slug, appId, cursor),
    queryFn: () => getOAuthAppMemberGrants({ slug, appId, cursor }),
    enabled: enabled && USE_MOCKS && Boolean(slug) && Boolean(appId),
    ...options,
  })
