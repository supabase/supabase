import { Control, ControllerRenderProps } from "react-hook-form"

export interface ResourceAccessProps {
  control: Control<{
    resourceAccess: 'selected-orgs' | 'selected-projects' | 'all-orgs'
    tokenName: string
    selectedOrganizations?: string[]
    selectedProjects?: string[]
    expiresAt?: string
    permissionRows?: { resource: string; action: string }[]
  }>
  resourceAccess: string
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