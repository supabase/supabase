import React from 'react'

export type CustomOptionProps = {
  onChange: (value: string) => void
  onCancel: () => void
  search?: string
}

export type FilterOptionObject = {
  label: string
  value: string
}

export type CustomOptionObject = {
  label?: string
  component: (props: CustomOptionProps) => React.ReactElement
}

export type FilterOption = string | FilterOptionObject | CustomOptionObject

export type AsyncOptionsFunction = (search?: string) => Promise<(string | FilterOptionObject)[]>
export type SyncOptionsFunction = (search?: string) => (string | FilterOptionObject)[]

export type FilterOperatorObject = {
  value: string
  label: string
}

export type FilterOperator = string | FilterOperatorObject

export type FilterProperty = {
  label: string
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  options?: FilterOption[] | AsyncOptionsFunction | SyncOptionsFunction | CustomOptionObject
  operators?: FilterOperator[]
}

export type FilterCondition = {
  propertyName: string
  value: string | number | boolean | Date | null
  operator: string
}

export type FilterGroup = {
  logicalOperator: 'AND' | 'OR'
  conditions: (FilterCondition | FilterGroup)[]
}

export function isGroup(condition: FilterCondition | FilterGroup): condition is FilterGroup {
  return 'logicalOperator' in condition
}

export type FilterBarAction = {
  value: string
  label: string
  icon?: React.ReactNode
  onSelect: (
    inputValue: string,
    context: { path: number[]; activeFilters: FilterGroup }
  ) => void | Promise<void>
}

export type SerializableFilterProperty = Pick<
  FilterProperty,
  'label' | 'name' | 'type' | 'operators'
> & {
  options?: string[]
}

export type AIFilterRequestPayload = {
  prompt: string
  filterProperties: SerializableFilterProperty[]
  currentPath: number[]
}
