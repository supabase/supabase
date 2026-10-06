import { PermissionAction } from '@supabase/shared-types/out/constants'

import {
  MEMBER_ROLE_LINE_HEIGHT,
  MEMBER_ROW_MIN_HEIGHT,
  type MfaFilter,
} from './MembersList.constants'
import type { OrganizationMember } from '@/data/organizations/organization-members-query'
import { doPermissionsCheck } from '@/hooks/misc/useCheckPermissions'
import type { Permission, Role } from '@/types'

export const useGetRolesManagementPermissions = (
  orgSlug?: string,
  roles?: Role[],
  permissions?: Permission[]
): { rolesAddable: Number[]; rolesRemovable: Number[] } => {
  const rolesAddable: Number[] = []
  const rolesRemovable: Number[] = []
  if (!roles || !orgSlug) return { rolesAddable, rolesRemovable }

  roles.forEach((role: Role) => {
    const canAdd = doPermissionsCheck(
      permissions,
      PermissionAction.CREATE,
      'auth.subject_roles',
      {
        resource: { role_id: role.id },
      },
      orgSlug
    )
    if (canAdd) rolesAddable.push(role.id)

    const canRemove = doPermissionsCheck(
      permissions,
      PermissionAction.DELETE,
      'auth.subject_roles',
      {
        resource: { role_id: role.id },
      },
      orgSlug
    )
    if (canRemove) rolesRemovable.push(role.id)
  })

  return { rolesAddable, rolesRemovable }
}

export const hasMultipleOwners = (members: OrganizationMember[] = [], roles: Role[] = []) => {
  const membersWhoAreOwners = members.filter((member) => {
    const [memberRoleId] = member.role_ids ?? []
    const role = roles.find((role: Role) => role.id === memberRoleId)
    return role?.name === 'Owner' && !member.invited_at
  })
  return membersWhoAreOwners.length > 1
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
