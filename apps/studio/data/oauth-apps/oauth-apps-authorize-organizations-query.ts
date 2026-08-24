import { useQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthAppsAuthorizeIdentity, USE_MOCKS } from './mocks'
import type { OAuthOrganizationRole } from './types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OAuthAppsAuthorizeOrganizationsVariables = {
  id?: string
}

export type OAuthAppsAuthorizeIdentity = {
  email: string
  organizations: OAuthOrganizationRole[]
}

export async function getOAuthAppsAuthorizeIdentity({
  id,
}: OAuthAppsAuthorizeOrganizationsVariables) {
  if (!id) throw new Error('Authorization request id is required')
  return getMockOAuthAppsAuthorizeIdentity(id)
}

export type OAuthAppsAuthorizeOrganizationsData = Awaited<
  ReturnType<typeof getOAuthAppsAuthorizeIdentity>
>
export type OAuthAppsAuthorizeOrganizationsError = ResponseError

export const useOAuthAppsAuthorizeOrganizationsQuery = <
  TData = OAuthAppsAuthorizeOrganizationsData,
>(
  { id }: OAuthAppsAuthorizeOrganizationsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    OAuthAppsAuthorizeOrganizationsData,
    OAuthAppsAuthorizeOrganizationsError,
    TData
  > = {}
) =>
  useQuery<OAuthAppsAuthorizeOrganizationsData, OAuthAppsAuthorizeOrganizationsError, TData>({
    queryKey: oauthAppsKeys.authorizeOrganizations(id),
    queryFn: () => getOAuthAppsAuthorizeIdentity({ id }),
    enabled: enabled && USE_MOCKS && typeof id !== 'undefined',
    ...options,
  })
