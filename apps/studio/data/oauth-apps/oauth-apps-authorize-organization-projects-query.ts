import { useQuery } from '@tanstack/react-query'

import { oauthAppsKeys } from './keys'
import { getMockOAuthAppsAuthorizeOrganizationProjects, USE_MOCKS } from './mocks'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OAuthAppsAuthorizeOrganizationProjectsVariables = {
  id?: string
  slug?: string
}

export type OAuthAppsAuthorizeOrganizationProject = {
  ref: string
  name: string
}

export async function getOAuthAppsAuthorizeOrganizationProjects({
  id,
  slug,
}: OAuthAppsAuthorizeOrganizationProjectsVariables) {
  if (!id) throw new Error('Authorization request id is required')
  if (!slug) throw new Error('Organization slug is required')
  return getMockOAuthAppsAuthorizeOrganizationProjects(slug)
}

export type OAuthAppsAuthorizeOrganizationProjectsData = Awaited<
  ReturnType<typeof getOAuthAppsAuthorizeOrganizationProjects>
>
export type OAuthAppsAuthorizeOrganizationProjectsError = ResponseError

export const useOAuthAppsAuthorizeOrganizationProjectsQuery = <
  TData = OAuthAppsAuthorizeOrganizationProjectsData,
>(
  { id, slug }: OAuthAppsAuthorizeOrganizationProjectsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    OAuthAppsAuthorizeOrganizationProjectsData,
    OAuthAppsAuthorizeOrganizationProjectsError,
    TData
  > = {}
) =>
  useQuery<
    OAuthAppsAuthorizeOrganizationProjectsData,
    OAuthAppsAuthorizeOrganizationProjectsError,
    TData
  >({
    queryKey: oauthAppsKeys.authorizeOrganizationProjects(id, slug),
    queryFn: () => getOAuthAppsAuthorizeOrganizationProjects({ id, slug }),
    enabled: enabled && USE_MOCKS && typeof id !== 'undefined' && typeof slug !== 'undefined',
    ...options,
  })
