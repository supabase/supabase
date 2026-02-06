import { Control, ControllerRenderProps, UseFormSetValue } from 'react-hook-form'
import { TokenFormValues } from '../../../AccessToken.schemas'

export interface ResourceAccessProps {
  control: Control<TokenFormValues>
  resourceAccess: string
  setValue: UseFormSetValue<TokenFormValues>
}

export interface ResourceItem {
  id: string
  name: string
}

export interface ResourceMultiSelectorProps {
  field: ControllerRenderProps<any, any>
  items: ResourceItem[]
  isLoading: boolean
  fieldName: string
  label: string
  loadingMessage: string
  emptyMessage: string
}

export interface ResourceOptionProps {
  value: string
  label: string
  isSelected: boolean
  onChange: () => void
}
