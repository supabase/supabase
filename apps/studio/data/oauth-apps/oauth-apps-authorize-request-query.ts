import { useQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthAppsAuthorizeRequest, USE_MOCKS } from './mocks'
import type { OAuthExistingGrant, OAuthScopeGroup } from './types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OAuthAppsAuthorizeRequestVariables = {
  id?: string
}

export type OAuthAppsAuthorizeRequest = {
  client_id: string
  app_name: string
  publisher: string
  is_verified: boolean
  redirect_uri: string
  scope_groups: OAuthScopeGroup[]
  /**
   * PROVISIONAL — set for clients that map one Supabase authorization onto several of their own
   * workspaces, so a grant made here shows up in places the user did not expect. Declared by the
   * client at registration; the exact field name lands with the real endpoint.
   */
  reuses_grant_across_workspaces: boolean
  /** Populated when the user has authorized this app before. See {@link OAuthExistingGrant}. */
  existing_grant: OAuthExistingGrant | null
}

export async function getOAuthAppsAuthorizeRequest({ id }: OAuthAppsAuthorizeRequestVariables) {
  if (!id) throw new Error('Authorization request id is required')
  if (!USE_MOCKS) throw new Error('OAuth app authorization request is not yet implemented')

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
    enabled: enabled && USE_MOCKS && Boolean(id),
    ...options,
  })
