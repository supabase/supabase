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

  // [Joshen TODO] Hardcoded logic until BE is ready
  availableRoles.forEach((role: string) => {
    const selectedRole = roles.find((r) => r.name === role)
    if (!selectedRole) return

    // This is if the logged in user is an Owner
    rolesAddable.push(selectedRole.id)
    rolesRemovable.push(selectedRole.id)

    // This is if the logged in user is an Admin
    // if (role !== 'Owner') {
    //   rolesAddable.push(selectedRole.id)
    //   rolesRemovable.push(selectedRole.id)
    // }

    // Just comment out everything if doing for developer
  })

  // [Joshen TODO] This is the correct logic but BE is not ready
  // availableRoles.forEach((role: string) => {
  //   const selectedRole = roles.find((r) => r.name === role)
  //   if (!selectedRole) return

  //   const canAdd = checkPermissions(PermissionAction.SQL_INSERT, 'postgres.auth.subject_roles', {
  //     resource: { role_id: selectedRole!.id },
  //   })
  //   if (canAdd) rolesAddable.push(selectedRole.id)

  //   const canRemove = checkPermissions(PermissionAction.SQL_DELETE, 'postgres.auth.subject_roles', {
  //     resource: { role_id: selectedRole!.id },
  //   })
  //   if (canRemove) rolesRemovable.push(selectedRole.id)
  // })

  return { rolesAddable, rolesRemovable }
}
