import { PermissionAction } from '@supabase/shared-types/out/constants'
import { doPermissionsCheck, useGetPermissions } from 'hooks'
import { Member, Permission, Role } from 'types'

export const useGetRolesManagementPermissions = (
  orgId?: number,
  roles?: Role[],
  permissions?: Permission[]
): { rolesAddable: Number[]; rolesRemovable: Number[] } => {
  const { permissions: allPermissions, organizationId } = useGetPermissions(
    permissions,
    orgId,
    permissions !== undefined && orgId !== undefined
  )

  const rolesAddable: Number[] = []
  const rolesRemovable: Number[] = []
  if (!roles || !orgId) return { rolesAddable, rolesRemovable }

  roles.forEach((role: Role) => {
    const canAdd = doPermissionsCheck(
      allPermissions,
      PermissionAction.CREATE,
      'auth.subject_roles',
      {
        resource: { role_id: role.id },
      },
      organizationId
    )
    if (canAdd) rolesAddable.push(role.id)

    const canRemove = doPermissionsCheck(
      allPermissions,
      PermissionAction.DELETE,
      'auth.subject_roles',
      {
        resource: { role_id: role.id },
      },
      organizationId
    )
    if (canRemove) rolesRemovable.push(role.id)
  })

  return { rolesAddable, rolesRemovable }
}

export const hasMultipleOwners = (members: Member[] = [], roles: Role[] = []) => {
  const membersWhoAreOwners = members.filter((member) => {
    const [memberRoleId] = member.role_ids ?? []
    const role = roles.find((role: Role) => role.id === memberRoleId)
    return role?.name === 'Owner' && !member.invited_at
  })
  return membersWhoAreOwners.length > 1
}
