import { Role } from 'types'
import { checkPermissions } from 'hooks'
import { PermissionAction } from '@supabase/shared-types/out/constants'

export const getRolesManagementPermissions = (
  roles: Role[]
): { rolesAddable: Number[]; rolesRemovable: Number[] } => {
  const rolesAddable: Number[] = []
  const rolesRemovable: Number[] = []
  if (!roles) return { rolesAddable, rolesRemovable }

  const availableRoles = ['Owner', 'Administrator', 'Developer']

  availableRoles.forEach((role: string) => {
    const selectedRole = roles.find((r) => r.name === role)
    if (!selectedRole) return

    const canAdd = checkPermissions(PermissionAction.CREATE, 'auth.subject_roles', {
      resource: { role_id: selectedRole!.id },
    })
    if (canAdd) rolesAddable.push(selectedRole.id)

    const canRemove = checkPermissions(PermissionAction.DELETE, 'auth.subject_roles', {
      resource: { role_id: selectedRole!.id },
    })
    if (canRemove) rolesRemovable.push(selectedRole.id)
  })

  return { rolesAddable, rolesRemovable }
}
