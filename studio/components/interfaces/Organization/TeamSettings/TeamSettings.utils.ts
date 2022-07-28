import { Role } from 'types'
import { checkPermissions } from 'hooks'
import { PermissionAction } from '@supabase/shared-types/out/constants'

export const getRolesManagementPermissions = (roles: Role[]) => {
  if (!roles) return roles

  const rolesPermissions: any = {}
  const availableRoles = ['Owner', 'Administrator', 'Developer']

  availableRoles.forEach((role: string) => {
    const selectedRole = roles.find((r) => r.name === role)
    if (!selectedRole) return

    const canChangeTo = checkPermissions(
      PermissionAction.SQL_INSERT,
      'postgres.auth.subject_roles',
      { resource: { role_id: selectedRole!.id } }
    )
    const canChangeFrom = checkPermissions(
      PermissionAction.SQL_DELETE,
      'postgres.auth.subject_roles',
      { resource: { role_id: selectedRole!.id } }
    )
    rolesPermissions[selectedRole!.id] = { canChangeTo, canChangeFrom }
  })

  return rolesPermissions
}
