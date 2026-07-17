import { Control, FieldValues } from 'react-hook-form'

import { TokenFormValues } from '../../../AccessToken.schemas'

export interface PermissionResource {
  resource: string
  title: string
  actions: string[]
}

export interface PermissionRow {
  resource: string
  actions: string[]
}

export interface PermissionsFormValues extends FieldValues {
  permissionRows?: PermissionRow[]
}

export interface PermissionsProps {
  control: Control<TokenFormValues>
  resourceSearchOpen: boolean
  setResourceSearchOpen: (open: boolean) => void
}

export interface PermissionResourceSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  permissionRows: PermissionRow[]
  onResourceToggled: (resource: PermissionResource) => void
  align?: 'center' | 'end' | 'start'
}
