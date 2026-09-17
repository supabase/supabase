import { useQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthAppsAuthorizeRequest, USE_MOCKS } from './mocks'
import type {
  OAuthAppGrantConfig,
  OAuthAppsAuthorizeLiveFields,
  OAuthExistingGrant,
  OAuthScopeGroup,
} from './types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OAuthAppsAuthorizeRequestVariables = {
  id?: string
}

/**
 * `OAuthAppsAuthorizeLiveFields` carries everything the live endpoint already
 * returns (name, website, domain, icon, redirect_uri, registration_type,
 * expires_at) straight off the generated schema. The fields below are the
 * additions the new grant model needs and no endpoint serves yet.
 */
export type OAuthAppsAuthorizeRequest = OAuthAppsAuthorizeLiveFields & {
  /** PROVISIONAL — the live response identifies the app by name and domain, not client_id. */
  client_id: string
  /** PROVISIONAL — no live counterpart; publisher verification is not in the contract yet. */
  is_verified: boolean
  /** PROVISIONAL — the live response returns flat `scopes`; grouping is an RFC addition. */
  scope_groups: OAuthScopeGroup[]
  /** PROVISIONAL — exact field name lands with the real endpoint. */
  reuses_grant_across_workspaces: boolean
  /** PROVISIONAL — repeated ?project_ref params on the authorize URL, validated server-side to refs the member can access, capped at 10. */
  suggested_project_refs: string[]
  grant_config: OAuthAppGrantConfig
  /** PROVISIONAL — supersedes the live `approved_at` / `approved_organization_slug` pair. */
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
