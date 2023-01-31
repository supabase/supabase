import { Member, Role } from 'types'
import { checkPermissions } from 'hooks'
import { PermissionAction } from '@supabase/shared-types/out/constants'

export const getRolesManagementPermissions = (
  roles: Role[]
): { rolesAddable: Number[]; rolesRemovable: Number[] } => {
  const rolesAddable: Number[] = []
  const rolesRemovable: Number[] = []
  if (!roles) return { rolesAddable, rolesRemovable }

  roles.forEach((role: Role) => {
    const canAdd = checkPermissions(PermissionAction.CREATE, 'auth.subject_roles', {
      resource: { role_id: role.id },
    })
    if (canAdd) rolesAddable.push(role.id)

    const canRemove = checkPermissions(PermissionAction.DELETE, 'auth.subject_roles', {
      resource: { role_id: role.id },
    })
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
