import { ActiveInputState, FilterBarAction, FilterGroup, FilterProperty, MenuItem } from './types'
import {
  findConditionByPath,
  isCustomOptionObject,
  isFilterOperatorObject,
  isFilterOptionObject,
} from './utils'

export function buildOperatorItems(
  activeInput: Extract<ActiveInputState, { type: 'operator' }> | null,
  activeFilters: FilterGroup,
  filterProperties: FilterProperty[],
  hasTypedSinceFocus: boolean = true,
  inputValue?: string
): MenuItem[] {
  if (!activeInput) return []
  const condition = findConditionByPath(activeFilters, activeInput.path)
  const property = filterProperties.find((p) => p.name === condition?.propertyName)
  const operatorValue = (inputValue ?? condition?.operator ?? '').toUpperCase()
  const availableOperators = property?.operators || ['=']

  // Only filter if user has typed since focusing
  const shouldFilter = hasTypedSinceFocus && operatorValue.length > 0

  const items: MenuItem[] = availableOperators
    .filter((op) => {
      if (!shouldFilter) return true
      if (isFilterOperatorObject(op)) {
        return (
          op.value.toUpperCase().includes(operatorValue) ||
          op.label.toUpperCase().includes(operatorValue)
        )
      }
      return op.toUpperCase().includes(operatorValue)
    })
    .map((op) => {
      if (isFilterOperatorObject(op)) {
        return {
          value: op.value,
          label: op.label,
          group: op.group,
          operatorSymbol: op.value,
        }
      }
      return { value: op, label: op, operatorSymbol: op }
    })

  if (shouldFilter && items.length === 0) {
    const equalsOperator = availableOperators.find((op) =>
      isFilterOperatorObject(op) ? op.value === '=' : op === '='
    )

    if (equalsOperator) {
      const equalsLabel = isFilterOperatorObject(equalsOperator) ? equalsOperator.label : 'Equals'
      items.push({
        value: '=',
        label: `${equalsLabel}: "${inputValue ?? condition?.operator ?? ''}"`,
        operatorSymbol: '=',
        isDefaultOperator: true,
        defaultValue: inputValue ?? condition?.operator ?? '',
      })
    }
  }

  return items
}

export function buildPropertyItems(params: {
  filterProperties: FilterProperty[]
  inputValue: string
  supportsOperators?: boolean
  actions?: FilterBarAction[]
}): MenuItem[] {
  const { filterProperties, inputValue, supportsOperators, actions } = params
  const items: MenuItem[] = []

  items.push(
    ...filterProperties
      .filter((prop) => prop.label.toLowerCase().includes(inputValue.toLowerCase()))
      .map((prop) => ({ value: prop.name, label: prop.label }))
  )

  if (supportsOperators) {
    items.push({ value: 'group', label: 'New Group' })
  }

  const trimmedInput = inputValue.trim()
  if (actions && trimmedInput.length > 0) {
    actions.forEach((action) => {
      items.push({
        value: action.value,
        label: action.label,
        icon: action.icon,
        isAction: true,
        action,
        actionInputValue: trimmedInput,
      })
    })
  }

  return items
}

export function buildPropertyChangeItems(params: {
  filterProperties: FilterProperty[]
  currentPropertyName: string
  inputValue: string
}): MenuItem[] {
  const { filterProperties, currentPropertyName, inputValue } = params

  return filterProperties
    .filter((prop) => prop.name !== currentPropertyName)
    .filter((prop) => prop.label.toLowerCase().includes(inputValue.toLowerCase()))
    .map((prop) => ({ value: prop.name, label: prop.label }))
}

export function buildValueItems(
  activeInput: Extract<ActiveInputState, { type: 'value' }> | null,
  activeFilters: FilterGroup,
  filterProperties: FilterProperty[],
  propertyOptionsCache: Record<string, { options: any[]; searchValue: string }>,
  loadingOptions: Record<string, boolean>,
  inputValue: string,
  hasTypedSinceFocus: boolean = true
): MenuItem[] {
  if (!activeInput) return []
  const activeCondition = findConditionByPath(activeFilters, activeInput.path)
  const property = filterProperties.find((p) => p.name === activeCondition?.propertyName)
  const items: MenuItem[] = []

  if (!property) return items

  if (activeCondition?.operator === 'is') {
    return getIsOperatorValueItems(property, inputValue, hasTypedSinceFocus)
  }

  if (!Array.isArray(property.options) && isCustomOptionObject(property.options)) {
    items.push({
      value: 'custom',
      label: property.options.label || 'Custom...',
      isCustom: true,
      customOption: property.options.component,
    })
  } else if (loadingOptions[property.name]) {
    items.push({ value: 'loading', label: 'Loading options...' })
  } else if (Array.isArray(property.options)) {
    items.push(...getArrayOptionItems(property.options, inputValue, hasTypedSinceFocus))
  } else if (propertyOptionsCache[property.name]) {
    items.push(...getCachedOptionItems(propertyOptionsCache[property.name].options))
  }

  return items
}

function getArrayOptionItems(
  options: any[],
  inputValue: string,
  hasTypedSinceFocus: boolean
): MenuItem[] {
  const items: MenuItem[] = []
  const normalizedInput = inputValue.toLowerCase()

  // Only filter if user has typed since focusing
  const shouldFilter = hasTypedSinceFocus && inputValue.length > 0

  for (const option of options) {
    if (typeof option === 'string') {
      if (!shouldFilter || option.toLowerCase().includes(normalizedInput)) {
        items.push({ value: option, label: option })
      }
    } else if (isFilterOptionObject(option)) {
      if (!shouldFilter || option.label.toLowerCase().includes(normalizedInput)) {
        items.push({ value: option.value, label: option.label })
      }
    } else if (isCustomOptionObject(option)) {
      if (!shouldFilter || (option.label?.toLowerCase().includes(normalizedInput) ?? true)) {
        items.push({
          value: 'custom',
          label: option.label || 'Custom...',
          isCustom: true,
          customOption: option.component,
        })
      }
    }
  }
  return items
}

function getCachedOptionItems(options: any[]): MenuItem[] {
  return options.map((option) => {
    if (typeof option === 'string') {
      return { value: option, label: option }
    }
    return { value: option.value, label: option.label }
  })
}

function getIsOperatorValueItems(
  property: FilterProperty,
  inputValue: string,
  hasTypedSinceFocus: boolean
): MenuItem[] {
  const options: { value: string; label: string }[] = [
    { value: 'null', label: 'NULL' },
    { value: 'not null', label: 'NOT NULL' },
  ]

  if (property.type === 'boolean') {
    options.push({ value: 'true', label: 'TRUE' }, { value: 'false', label: 'FALSE' })
  }

  const shouldFilter = hasTypedSinceFocus && inputValue.length > 0
  if (!shouldFilter) return options

  const normalizedInput = inputValue.toLowerCase()
  return options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(normalizedInput) || opt.value.includes(normalizedInput)
  )
}
