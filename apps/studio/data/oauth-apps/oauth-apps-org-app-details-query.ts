import { useQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthOrgAppDetails, USE_MOCKS } from './mocks'
import type { OAuthOrgAppDetails } from './types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OAuthOrgAppDetailsVariables = {
  slug?: string
  appId?: string
}

export type { OAuthOrgAppDetails } from './types'

export async function getOAuthOrgAppDetails({
  slug,
  appId,
}: OAuthOrgAppDetailsVariables): Promise<OAuthOrgAppDetails> {
  if (!slug) throw new Error('Organization slug is required')
  if (!appId) throw new Error('App id is required')
  if (!USE_MOCKS) throw new Error('OAuth org app details are not yet implemented')

  return getMockOAuthOrgAppDetails(slug, appId)
}

export type OAuthOrgAppDetailsData = Awaited<ReturnType<typeof getOAuthOrgAppDetails>>
export type OAuthOrgAppDetailsError = ResponseError

export const useOAuthOrgAppDetailsQuery = <TData = OAuthOrgAppDetailsData>(
  { slug, appId }: OAuthOrgAppDetailsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OAuthOrgAppDetailsData, OAuthOrgAppDetailsError, TData> = {}
) =>
  useQuery<OAuthOrgAppDetailsData, OAuthOrgAppDetailsError, TData>({
    queryKey: oauthAppsKeys.orgAppDetails(slug, appId),
    queryFn: () => getOAuthOrgAppDetails({ slug, appId }),
    enabled: enabled && USE_MOCKS && Boolean(slug) && Boolean(appId),
    ...options,
  })
