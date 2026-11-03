import {
  MEMBER_ROLE_LINE_HEIGHT,
  MEMBER_ROW_MIN_HEIGHT,
  type MfaFilter,
} from './MembersList.constants'
import type { OrganizationMember } from '@/data/organizations/organization-members-query'
import { PermissionsV2Data } from '@/data/permissions/permissions-query-v2'
import type { Role } from '@/types'

export const hasMultipleOwners = (members: OrganizationMember[] = [], roles: Role[] = []) => {
  const membersWhoAreOwners = members.filter((member) => {
    const [memberRoleId] = member.role_ids ?? []
    const role = roles.find((role: Role) => role.id === memberRoleId)
    return role?.name === 'Owner' && !member.invited_at
  })
  return membersWhoAreOwners.length > 1
}

export function getOrgRole(
  data: PermissionsV2Data | undefined,
  slug?: string
): PermissionsV2Data['organizations'][number]['role'] | null {
  if (!data || !slug) return null
  return data.organizations.find((org) => org.slug === slug)?.role ?? null
}

/**
 * Only administrators and owners can assign/update roles;
 * the Owner role can only be assigned by another owner.
 */
export function getAssignableRoleIds(
  orgRole: PermissionsV2Data['organizations'][number]['role'] | null,
  orgScopedRoles: { id: number; name: string }[]
): number[] {
  if (orgRole !== 'administrator' && orgRole !== 'owner') return []
  return orgScopedRoles
    .filter((role) => role.name !== 'Owner' || orgRole === 'owner')
    .map((role) => role.id)
}

/**
 * Whether the current user's org role can manage (invite/remove/reassign) a member
 * holding `targetRoleName`.
 * Same rule as assignment: administrators and owners can manage members,
 * but Owner role members can only be managed by another owner.
 */
export function canManageRole(
  orgRole: PermissionsV2Data['organizations'][number]['role'] | null,
  targetRoleName?: string
): boolean {
  if (orgRole !== 'administrator' && orgRole !== 'owner') return false
  if (!targetRoleName) return false
  return targetRoleName !== 'Owner' || orgRole === 'owner'
}

/** Each role renders on its own line, so members with several roles need taller rows */
export const getMemberRowHeight = (member: Pick<OrganizationMember, 'role_ids'>) =>
  Math.max(MEMBER_ROW_MIN_HEIGHT, (member.role_ids?.length ?? 0) * MEMBER_ROLE_LINE_HEIGHT)

/** Pending invites have no MFA status, so they only show when the filter is off */
export const matchesMfaFilter = (
  member: Pick<OrganizationMember, 'invited_id' | 'mfa_enabled'>,
  filter: MfaFilter
) => {
  if (filter === 'all') return true
  if (member.invited_id) return false
  return filter === 'enabled' ? member.mfa_enabled : !member.mfa_enabled
}

export const matchesOrgRole = (member: Pick<OrganizationMember, 'role_ids'>, roles: number[]) => {
  if (roles.length === 0) return true
  return member.role_ids.some((r) => roles.includes(r))
}
