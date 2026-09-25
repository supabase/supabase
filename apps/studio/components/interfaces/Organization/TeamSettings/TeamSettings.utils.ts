import type { OrganizationMember } from '@/data/organizations/organization-members-query'
import type {  PermissionV2, Role } from '@/types'
import { RoleV2 } from '@/types/base'

export const hasMultipleOwners = (members: OrganizationMember[] = [], roles: Role[] = []) => {
  const membersWhoAreOwners = members.filter((member) => {
    const [memberRoleId] = member.role_ids ?? []
    const role = roles.find((role: Role) => role.id === memberRoleId)
    return role?.name === 'Owner' && !member.invited_at
  })
  return membersWhoAreOwners.length > 1
}

export function getOrgRole(data: PermissionV2 | undefined, slug?: string): RoleV2 | null {
  if (!data || !slug) return null
  return data.organizations.find((org) => org.slug === slug)?.role ?? null
}

/**
 * Only administrators and owners can assign/update roles;
 * the Owner role can only be assigned by another owner.
 */
export function getAssignableRoleIds(
  orgRole: RoleV2 | null,
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
 export function canManageRole(orgRole: RoleV2 | null, targetRoleName?: string): boolean {
   if (orgRole !== 'administrator' && orgRole !== 'owner') return false
   // unknown target role, fail closed
   if (!targetRoleName) return false
   return targetRoleName !== 'Owner' || orgRole === 'owner'
 }
