import { useQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthAppsPreflightValidation, USE_MOCKS } from './mocks'
import type { OAuthAppsAuthorizePreflightResult } from './types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OAuthAppsPreflightValidationVariables = {
  slug?: string
  appId?: string
}

export type { OAuthAppsAuthorizePreflightResult } from './types'

export async function getOAuthAppsPreflightValidation({
  slug,
  appId,
}: OAuthAppsPreflightValidationVariables): Promise<OAuthAppsAuthorizePreflightResult> {
  if (!slug) throw new Error('Organization slug is required')
  if (!appId) throw new Error('App id is required')
  if (!USE_MOCKS) throw new Error('OAuth app preflight validation is not yet implemented')

  return getMockOAuthAppsPreflightValidation(slug, appId)
}

export type OAuthAppsPreflightValidationData = Awaited<
  ReturnType<typeof getOAuthAppsPreflightValidation>
>
export type OAuthAppsPreflightValidationError = ResponseError

export const useOAuthAppsPreflightValidationQuery = <TData = OAuthAppsPreflightValidationData>(
  { slug, appId }: OAuthAppsPreflightValidationVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    OAuthAppsPreflightValidationData,
    OAuthAppsPreflightValidationError,
    TData
  > = {}
) =>
  useQuery<OAuthAppsPreflightValidationData, OAuthAppsPreflightValidationError, TData>({
    queryKey: oauthAppsKeys.preflightValidation(slug, appId),
    queryFn: () => getOAuthAppsPreflightValidation({ slug, appId }),
    enabled: enabled && USE_MOCKS && Boolean(slug) && Boolean(appId),
    ...options,
  })
