import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { API_URL } from 'lib/constants'
import { Member, ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationMembersVariables = {
  slug?: string
}

export async function getOrganizationMembers(
  { slug }: OrganizationMembersVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const [members, invites] = await Promise.all([
    get('/platform/organizations/{slug}/members', { params: { path: { slug } }, signal }),
    get('/platform/organizations/{slug}/members/invite', { params: { path: { slug } }, signal }),
  ])

  const { data: orgMembers, error: orgMembersError } = members
  const { data: orgInvites, error: orgInvitesError } = invites

  if (orgMembersError) throw orgMembersError
  if (orgInvitesError) throw orgInvitesError

  // Remap invite data to look like existing members data
  const invitedMembers = orgInvites.map((invite) => {
    const member = {
      is_owner: false,
      invited_at: invite.invited_at,
      invited_id: invite.invited_id,
      username: invite.invited_email.slice(0, 1),
      primary_email: invite.invited_email,
    }
    return { ...member, role_ids: [invite.role_id] }
  })

  return [...orgMembers, ...invitedMembers] as Member[]
}

export type OrganizationMembersData = Awaited<ReturnType<typeof getOrganizationMembers>>
export type OrganizationMembersError = ResponseError

export const useOrganizationMembersQuery = <TData = OrganizationMembersData>(
  { slug }: OrganizationMembersVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationMembersData, OrganizationMembersError, TData> = {}
) =>
  useQuery<OrganizationMembersData, OrganizationMembersError, TData>(
    organizationKeys.members(slug),
    ({ signal }) => getOrganizationMembers({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
