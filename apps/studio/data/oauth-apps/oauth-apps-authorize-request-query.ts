import { useQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthAppsAuthorizeRequest, USE_MOCKS } from './mocks'
import type { OAuthScopeGroup, OAuthScopeLevel } from './types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OAuthAppsAuthorizeRequestVariables = {
  id?: string
}

export type OAuthAppsResourceScope = {
  resource: string
  count: number
  scopes: { name: string; level: OAuthScopeLevel }[]
}

export type OAuthAppsAuthorizeRequest = {
  client_id: string
  app_name: string
  publisher: string
  is_verified: boolean
  redirect_uri: string
  scope_groups: OAuthScopeGroup[]
  resource_scopes: OAuthAppsResourceScope[]
}

export async function getOAuthAppsAuthorizeRequest({ id }: OAuthAppsAuthorizeRequestVariables) {
  if (!id) throw new Error('Authorization request id is required')
  return getMockOAuthAppsAuthorizeRequest(id)
}

export type OAuthAppsAuthorizeRequestData = Awaited<ReturnType<typeof getOAuthAppsAuthorizeRequest>>
export type OAuthAppsAuthorizeRequestError = ResponseError

export const useOAuthAppsAuthorizeRequestQuery = <TData = OAuthAppsAuthorizeRequestData>(
  { id }: OAuthAppsAuthorizeRequestVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    OAuthAppsAuthorizeRequestData,
    OAuthAppsAuthorizeRequestError,
    TData
  > = {}
) =>
  useQuery<OAuthAppsAuthorizeRequestData, OAuthAppsAuthorizeRequestError, TData>({
    queryKey: oauthAppsKeys.authorizeRequest(id),
    queryFn: () => getOAuthAppsAuthorizeRequest({ id }),
    enabled: enabled && USE_MOCKS && typeof id !== 'undefined',
    ...options,
  })
