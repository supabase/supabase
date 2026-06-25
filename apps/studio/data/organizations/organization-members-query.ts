import { useQuery } from '@tanstack/react-query'

import { organizationKeys } from './keys'
import { getTrackedGuestInvite } from '@/components/interfaces/TemporaryAccess/guest-invite-tracking'
import type { PendingInvitationAccessGrant } from '@/components/interfaces/TemporaryAccess/TemporaryAccess.types'
import type { components } from '@/data/api'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OrganizationMembersVariables = {
  slug?: string
}

export type Member = components['schemas']['Member']
export interface OrganizationMember extends Member {
  invited_at?: string
  invited_id?: number
  /** Present on pending invites when the platform API returns scoped projects. */
  invited_role_scoped_projects?: string[]
  /** Set when this pending invite was sent as External collaborator from this browser session. */
  invited_is_external_collaborator?: boolean
  /** Guest database access configured at invite time (session storage until platform API supports it). */
  invited_pending_access_grant?: PendingInvitationAccessGrant
}

export async function getOrganizationMembers(
  { slug }: OrganizationMembersVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const [members, invites] = await Promise.all([
    get('/platform/organizations/{slug}/members', { params: { path: { slug } }, signal }),
    get('/platform/organizations/{slug}/members/invitations', {
      params: { path: { slug } },
      signal,
    }),
  ])

  const { data: orgMembers, error: orgMembersError } = members
  const { data: orgInvites, error: orgInvitesError } = invites

  if (orgMembersError) handleError(orgMembersError)
  if (orgInvitesError) handleError(orgInvitesError)

  // Remap invite data to look like existing members data
  const invitedMembers = orgInvites.invitations.map((invite) => {
    const inviteWithScope = invite as typeof invite & { role_scoped_projects?: string[] }
    const normalizedEmail = invite.invited_email.trim().toLowerCase()
    const trackedGuestInvite = getTrackedGuestInvite(slug, normalizedEmail)
    const member = {
      invited_at: invite.invited_at,
      invited_id: invite.id,
      mfa_enabled: false,
      username: invite.invited_email.slice(0, 1),
      primary_email: invite.invited_email,
      ...(inviteWithScope.role_scoped_projects?.length
        ? { invited_role_scoped_projects: inviteWithScope.role_scoped_projects }
        : {}),
      ...(trackedGuestInvite
        ? {
            invited_is_external_collaborator: true,
            ...(trackedGuestInvite.pendingAccessGrant
              ? { invited_pending_access_grant: trackedGuestInvite.pendingAccessGrant }
              : {}),
          }
        : {}),
    }
    return { ...member, role_ids: [invite.role_id] }
  })

  return [...orgMembers, ...invitedMembers] as OrganizationMember[]
}

export type OrganizationMembersData = Awaited<ReturnType<typeof getOrganizationMembers>>
export type OrganizationMembersError = ResponseError

export const useOrganizationMembersQuery = <TData = OrganizationMembersData>(
  { slug }: OrganizationMembersVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OrganizationMembersData, OrganizationMembersError, TData> = {}
) =>
  useQuery<OrganizationMembersData, OrganizationMembersError, TData>({
    queryKey: organizationKeys.members(slug),
    queryFn: ({ signal }) => getOrganizationMembers({ slug }, signal),
    enabled: enabled && typeof slug !== 'undefined',
    ...options,
  })
