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

export type FilterOperatorGroup = 'comparison' | 'pattern' | 'setNull' | 'uncategorized'

export const OPERATOR_GROUP_LABELS: Record<FilterOperatorGroup, string> = {
  comparison: 'COMPARISON',
  pattern: 'PATTERN MATCHING',
  setNull: 'SET & NULL CHECKS',
  uncategorized: 'OTHER',
}

export const GROUP_ORDER: FilterOperatorGroup[] = [
  'comparison',
  'pattern',
  'setNull',
  'uncategorized',
]

export type OperatorDefinition = {
  value: string
  label: string
  group: FilterOperatorGroup
}

export type FilterOperatorObject = {
  value: string
  label: string
  group?: FilterOperatorGroup
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

export type ConditionPath = number[]

export type FilterBarAction = {
  value: string
  label: string
  icon?: React.ReactNode
  onSelect: (
    inputValue: string,
    context: { path: ConditionPath; activeFilters: FilterGroup }
  ) => void | Promise<void>
}

export type MenuItem = {
  value: string
  label: string
  icon?: React.ReactNode
  isCustom?: boolean
  customOption?: (props: CustomOptionProps) => React.ReactElement
  isAction?: boolean
  action?: FilterBarAction
  actionInputValue?: string
  group?: FilterOperatorGroup
  operatorSymbol?: string
}

export type GroupedMenuItem = {
  item: MenuItem
  index: number
}

export type MenuItemGroup = {
  group: FilterOperatorGroup
  items: GroupedMenuItem[]
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
  currentPath: ConditionPath
}

export type NavigationDirection = 'prev' | 'next'

export type HighlightNavigationResult = ConditionPath | 'clear' | null

export type ActiveInputState =
  | { type: 'value'; path: ConditionPath }
  | { type: 'operator'; path: ConditionPath }
  | { type: 'group'; path: ConditionPath }
  | null

export type KeyboardNavigationConfig = {
  activeInput: ActiveInputState
  setActiveInput: (input: ActiveInputState) => void
  activeFilters: FilterGroup
  onFilterChange: (filters: FilterGroup) => void
  highlightedConditionPath: ConditionPath | null
  setHighlightedConditionPath: (path: ConditionPath | null) => void
}
