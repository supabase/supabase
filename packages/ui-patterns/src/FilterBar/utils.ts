import {
  AsyncOptionsFunction,
  CustomOptionObject,
  FilterCondition,
  FilterGroup,
  FilterOperatorObject,
  FilterOptionObject,
  FilterProperty,
  GROUP_ORDER,
  GroupedMenuItem,
  isGroup,
  MenuItem,
  MenuItemGroup,
  SyncOptionsFunction,
} from './types'

export function pathsEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

export function findGroupByPath(group: FilterGroup, path: number[]): FilterGroup | null {
  if (path.length === 0) return group

  const [current, ...rest] = path
  const condition = group.conditions[current]
  if (!condition) return null

  if (rest.length === 0) {
    return isGroup(condition) ? condition : null
  }

  if (isGroup(condition)) {
    return findGroupByPath(condition, rest)
  }

  return null
}

export function findConditionByPath(group: FilterGroup, path: number[]): FilterCondition | null {
  if (path.length === 0) return null

  const [current, ...rest] = path
  const condition = group.conditions[current]
  if (!condition) return null

  if (rest.length === 0) {
    return isGroup(condition) ? null : condition
  }

  if (isGroup(condition)) {
    return findConditionByPath(condition, rest)
  }

  return null
}

export function isCustomOptionObject(option: any): option is CustomOptionObject {
  return typeof option === 'object' && option !== null && 'component' in option
}

export function isFilterOptionObject(option: any): option is FilterOptionObject {
  return typeof option === 'object' && option !== null && 'value' in option && 'label' in option
}

export function isFilterOperatorObject(operator: any): operator is FilterOperatorObject {
  return (
    typeof operator === 'object' && operator !== null && 'value' in operator && 'label' in operator
  )
}

export function isAsyncOptionsFunction(
  options: FilterProperty['options']
): options is AsyncOptionsFunction {
  if (!options || Array.isArray(options) || isCustomOptionObject(options)) return false
  if (typeof options !== 'function') return false
  // More reliable async function detection
  const fnString = options.toString()
  return (
    options.constructor.name === 'AsyncFunction' ||
    fnString.startsWith('async ') ||
    fnString.includes('async function')
  )
}

export function isSyncOptionsFunction(
  options: FilterProperty['options']
): options is SyncOptionsFunction {
  if (!options || Array.isArray(options) || isCustomOptionObject(options)) return false
  return typeof options === 'function'
}

export function updateNestedFilter(
  group: FilterGroup,
  path: number[],
  updateFn: (condition: FilterCondition) => FilterCondition
): FilterGroup {
  if (path.length === 1) {
    return {
      ...group,
      conditions: group.conditions.map((condition, index) =>
        index === path[0] ? updateFn(condition as FilterCondition) : condition
      ),
    }
  }

  const [current, ...rest] = path
  return {
    ...group,
    conditions: group.conditions.map((condition, index) =>
      index === current && isGroup(condition)
        ? updateNestedFilter(condition, rest, updateFn)
        : condition
    ),
  }
}

export function removeFromGroup(group: FilterGroup, path: number[]): FilterGroup {
  if (path.length === 1) {
    return {
      ...group,
      conditions: group.conditions.filter((_, i) => i !== path[0]),
    }
  }

  const [current, ...rest] = path
  return {
    ...group,
    conditions: group.conditions.map((condition, i) =>
      i === current ? removeFromGroup(condition as FilterGroup, rest) : condition
    ),
  }
}

export function addFilterToGroup(
  group: FilterGroup,
  path: number[],
  property: FilterProperty
): FilterGroup {
  if (path.length === 0) {
    return {
      ...group,
      conditions: [...group.conditions, { propertyName: property.name, value: '', operator: '' }],
    }
  }

  const [current, ...rest] = path
  return {
    ...group,
    conditions: group.conditions.map((condition, i) =>
      i === current ? addFilterToGroup(condition as FilterGroup, rest, property) : condition
    ),
  }
}

export function addGroupToGroup(group: FilterGroup, path: number[]): FilterGroup {
  if (path.length === 0) {
    return {
      ...group,
      conditions: [...group.conditions, { logicalOperator: 'AND', conditions: [] }],
    }
  }

  const [current, ...rest] = path
  return {
    ...group,
    conditions: group.conditions.map((condition, i) =>
      i === current ? addGroupToGroup(condition as FilterGroup, rest) : condition
    ),
  }
}

export function updateNestedValue(
  group: FilterGroup,
  path: number[],
  newValue: string
): FilterGroup {
  if (path.length === 1) {
    return {
      ...group,
      conditions: group.conditions.map((condition, i) =>
        i === path[0] ? { ...condition, value: newValue } : condition
      ),
    }
  }

  const [current, ...rest] = path
  return {
    ...group,
    conditions: group.conditions.map((condition, i) =>
      i === current
        ? isGroup(condition)
          ? updateNestedValue(condition, rest, newValue)
          : condition
        : condition
    ),
  }
}

export function updateNestedOperator(
  group: FilterGroup,
  path: number[],
  newOperator: string
): FilterGroup {
  if (path.length === 1) {
    return {
      ...group,
      conditions: group.conditions.map((condition, i) =>
        i === path[0] ? { ...condition, operator: newOperator } : condition
      ),
    }
  }

  const [current, ...rest] = path
  return {
    ...group,
    conditions: group.conditions.map((condition, i) =>
      i === current
        ? isGroup(condition)
          ? updateNestedOperator(condition, rest, newOperator)
          : condition
        : condition
    ),
  }
}

export function updateNestedLogicalOperator(group: FilterGroup, path: number[]): FilterGroup {
  if (path.length === 0) {
    return {
      ...group,
      logicalOperator: group.logicalOperator === 'AND' ? 'OR' : 'AND',
    }
  }

  const [current, ...rest] = path
  return {
    ...group,
    conditions: group.conditions.map((condition, i) =>
      i === current
        ? isGroup(condition)
          ? updateNestedLogicalOperator(condition, rest)
          : condition
        : condition
    ),
  }
}

export function updateGroupAtPath(
  group: FilterGroup,
  path: number[],
  newGroup: FilterGroup
): FilterGroup {
  if (path.length === 0) {
    return newGroup
  }

  const [current, ...rest] = path
  return {
    ...group,
    conditions: group.conditions.map((condition, index) =>
      index === current ? updateGroupAtPath(condition as FilterGroup, rest, newGroup) : condition
    ),
  }
}

/**
 * Groups menu items by their operator group property.
 * Items are grouped in the order specified by GROUP_ORDER.
 * Items without a group are placed at the end.
 *
 * @param items - Array of menu items to group
 * @returns Array of menu item groups with their items and original indices
 */
export function groupMenuItemsByOperator(items: MenuItem[]): MenuItemGroup[] {
  const grouped = new Map<MenuItem['group'], GroupedMenuItem[]>()

  items.forEach((item, index) => {
    const group = item.group
    if (!grouped.has(group)) {
      grouped.set(group, [])
    }
    grouped.get(group)!.push({ item, index })
  })

  const result: MenuItemGroup[] = []

  // Add groups in defined order
  for (const groupKey of GROUP_ORDER) {
    if (grouped.has(groupKey)) {
      result.push({ group: groupKey, items: grouped.get(groupKey)! })
      grouped.delete(groupKey)
    }
  }

  // Add ungrouped items last
  if (grouped.has(undefined)) {
    result.push({ group: undefined, items: grouped.get(undefined)! })
  }

  return result
}
