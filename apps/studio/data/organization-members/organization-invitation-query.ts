import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationInvitationVariables = { slug?: string; token?: string }

export async function getOrganizationInvitation(
  { slug, token }: OrganizationInvitationVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('Slug is required')
  if (!token) throw new Error('Token is required')

  const { data, error } = await get('/platform/organizations/{slug}/members/invitations/{token}', {
    params: { path: { slug, token } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OrganizationInvitationData = Awaited<ReturnType<typeof getOrganizationInvitation>>
export type OrganizationInvitationError = ResponseError

export const useOrganizationInvitationV2Query = <TData = OrganizationInvitationData>(
  { slug, token }: OrganizationInvitationVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationInvitationData, OrganizationInvitationError, TData> = {}
) =>
  useQuery<OrganizationInvitationData, OrganizationInvitationError, TData>(
    organizationKeys.invitation(slug, token),
    ({ signal }) => getOrganizationInvitation({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined' && typeof token !== 'undefined',
      ...options,
    }
  )
