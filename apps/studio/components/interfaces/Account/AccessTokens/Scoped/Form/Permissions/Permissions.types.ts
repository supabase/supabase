import { FieldValues, UseFormSetValue, UseFormWatch } from 'react-hook-form'

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

export interface PermissionsProps<
  TFormValues extends PermissionsFormValues = PermissionsFormValues,
> {
  setValue: UseFormSetValue<TFormValues>
  watch: UseFormWatch<TFormValues>
  resourceSearchOpen: boolean
  setResourceSearchOpen: (open: boolean) => void
}

export interface PermissionResourceSelectorProps<TFormValues extends PermissionsFormValues> {
  open: boolean
  onOpenChange: (open: boolean) => void
  permissionRows: PermissionRow[]
  setValue: UseFormSetValue<TFormValues>
  align?: 'center' | 'end' | 'start'
}
