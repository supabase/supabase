import { permissions } from '@supabase/shared-types'

export interface Permission {
  id: string
  label: string
  description: string
}

export const PERMISSIONS: Permission[] = Object.values(permissions.FgaPermissions.PROJECT).map(
  (perm) => ({
    id: perm.id,
    label: perm.id,
    description: perm.title,
  })
)
