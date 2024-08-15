import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'
import { components } from 'api-types'

export type OrganizationInviteTokenVariables = { slug?: string; token?: string }

export type OrganizationInviteByToken = components['schemas']['InvitationByTokenResponse']

export async function getOrganizationInviteByToken(
  { slug, token }: OrganizationInviteTokenVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')
  if (!token) throw new Error('token is required')

  const { data, error } = await get('/platform/organizations/{slug}/members/invitations/{token}', {
    params: { path: { slug, token } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OrganizationInviteTokenData = Awaited<ReturnType<typeof getOrganizationInviteByToken>>
export type OrganizationInviteTokenError = ResponseError

export const useOrganizationInvitationTokenQuery = <TData = OrganizationInviteTokenData>(
  { slug, token }: OrganizationInviteTokenVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationInviteTokenData, OrganizationInviteTokenError, TData> = {}
) => {
  return useQuery<OrganizationInviteTokenData, OrganizationInviteTokenError, TData>(
    organizationKeys.token(slug, token),
    ({ signal }) => getOrganizationInviteByToken({ slug, token }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined' && typeof token !== 'undefined',
      ...options,
    }
  )
}
