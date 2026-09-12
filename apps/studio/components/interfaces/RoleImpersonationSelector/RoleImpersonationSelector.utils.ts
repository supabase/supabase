import type { ImpersonationRole, PostgrestRole } from '@/lib/role-impersonation'

export function getSelectedRoleOption(role: ImpersonationRole | undefined): PostgrestRole {
  if (role?.type === 'postgrest' && (role.role === 'anon' || role.role === 'authenticated')) {
    return role.role
  }

  return 'service_role'
}

type RoleSelectionUpdate =
  | { shouldSetRole: false }
  | { shouldSetRole: true; role: ImpersonationRole | undefined }

export function getRoleSelectionUpdate(value: PostgrestRole): RoleSelectionUpdate {
  if (value === 'service_role') {
    return { shouldSetRole: true, role: undefined }
  }

  if (value === 'anon') {
    return { shouldSetRole: true, role: { type: 'postgrest', role: 'anon' } }
  }

  return { shouldSetRole: false }
}
