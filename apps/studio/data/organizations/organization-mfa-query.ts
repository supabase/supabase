import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationMfaVariables = {
  slug?: string
}

export async function getOrganizationMfaEnforcement(
  { slug }: OrganizationMfaVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const orgMfa = await get('/platform/organizations/{slug}/members/mfa/enforcement', {
    params: { path: { slug } },
    signal,
  })

  const { data: orgMfaRequired, error: orgMfaError } = orgMfa

  if (orgMfaError) handleError(orgMfaError)

  return orgMfaRequired?.enforced
}

export type OrganizationMfaError = ResponseError

export const useOrganizationMfaQuery = <TData = boolean>(
  { slug }: OrganizationMfaVariables,
  { enabled = true, ...options }: UseQueryOptions<boolean, OrganizationMfaError, TData> = {}
) =>
  useQuery<boolean, OrganizationMfaError, TData>(
    organizationKeys.mfa(slug),
    ({ signal }) => getOrganizationMfaEnforcement({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
