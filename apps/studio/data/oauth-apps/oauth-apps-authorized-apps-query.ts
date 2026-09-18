import { useQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthAppsOverview, USE_MOCKS } from './mocks'
import type { ListOAuthAppsOverviewResponse } from './types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OAuthAuthorizedAppsVariables = {
  slug?: string
}

export type { ListOAuthAppsOverviewResponse, OAuthAppOverviewItem } from './types'

export async function getOAuthAuthorizedApps({
  slug,
}: OAuthAuthorizedAppsVariables): Promise<ListOAuthAppsOverviewResponse> {
  if (!slug) throw new Error('Organization slug is required')
  if (!USE_MOCKS) throw new Error('OAuth authorized apps are not yet implemented')

  return getMockOAuthAppsOverview()
}

export type OAuthAuthorizedAppsData = Awaited<ReturnType<typeof getOAuthAuthorizedApps>>
export type OAuthAuthorizedAppsError = ResponseError

export const useOAuthAuthorizedAppsQuery = <TData = OAuthAuthorizedAppsData>(
  { slug }: OAuthAuthorizedAppsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OAuthAuthorizedAppsData, OAuthAuthorizedAppsError, TData> = {}
) =>
  useQuery<OAuthAuthorizedAppsData, OAuthAuthorizedAppsError, TData>({
    queryKey: oauthAppsKeys.authorizedApps(slug),
    queryFn: () => getOAuthAuthorizedApps({ slug }),
    enabled: enabled && USE_MOCKS && Boolean(slug),
    ...options,
  })
