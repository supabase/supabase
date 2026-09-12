import { PermissionAction } from '@supabase/shared-types/out/constants'

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
