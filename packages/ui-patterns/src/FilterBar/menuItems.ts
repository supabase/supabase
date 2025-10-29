import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { ActiveInput } from './hooks'
import { FilterGroup, FilterProperty } from './types'
import { findConditionByPath, isCustomOptionObject, isFilterOptionObject } from './utils'

export type MenuItem = {
  value: string
  label: string
  icon?: React.ReactNode
  isCustom?: boolean
  customOption?: (props: any) => React.ReactElement
}

export function buildOperatorItems(
  activeInput: Extract<ActiveInput, { type: 'operator' }> | null,
  activeFilters: FilterGroup,
  filterProperties: FilterProperty[]
): MenuItem[] {
  if (!activeInput) return []
  const condition = findConditionByPath(activeFilters, activeInput.path)
  const property = filterProperties.find((p) => p.name === condition?.propertyName)
  const operatorValue = condition?.operator?.toUpperCase() || ''
  const availableOperators = property?.operators || ['=']

  return availableOperators
    .filter((op) => op.toUpperCase().includes(operatorValue))
    .map((op) => ({ value: op, label: op }))
}

export function buildPropertyItems(params: {
  filterProperties: FilterProperty[]
  inputValue: string
  aiApiUrl?: string
  supportsOperators?: boolean
}): MenuItem[] {
  const { filterProperties, inputValue, aiApiUrl, supportsOperators } = params
  const items: MenuItem[] = []

  items.push(
    ...filterProperties
      .filter((prop) => prop.label.toLowerCase().includes(inputValue.toLowerCase()))
      .map((prop) => ({ value: prop.name, label: prop.label }))
  )

  if (supportsOperators) {
    items.push({ value: 'group', label: 'New Group' })
  }

  if (inputValue.trim().length > 0 && aiApiUrl) {
    items.push({
      value: 'ai-filter',
      label: 'Filter by AI',
      icon: React.createElement(Sparkles, { className: 'mr-2 h-4 w-4', strokeWidth: 1.25 }),
    })
  }

  return items
}

export function buildValueItems(
  activeInput: Extract<ActiveInput, { type: 'value' }> | null,
  activeFilters: FilterGroup,
  filterProperties: FilterProperty[],
  propertyOptionsCache: Record<string, { options: any[]; searchValue: string }>,
  loadingOptions: Record<string, boolean>,
  inputValue: string
): MenuItem[] {
  if (!activeInput) return []
  const activeCondition = findConditionByPath(activeFilters, activeInput.path)
  const property = filterProperties.find((p) => p.name === activeCondition?.propertyName)
  const items: MenuItem[] = []

  if (!property) return items

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
    items.push(...getArrayOptionItems(property.options, inputValue))
  } else if (propertyOptionsCache[property.name]) {
    items.push(...getCachedOptionItems(propertyOptionsCache[property.name].options))
  }

  return items
}

function getArrayOptionItems(options: any[], inputValue: string): MenuItem[] {
  const items: MenuItem[] = []
  for (const option of options) {
    if (typeof option === 'string') {
      if (option.toLowerCase().includes(inputValue.toLowerCase())) {
        items.push({ value: option, label: option })
      }
    } else if (isFilterOptionObject(option)) {
      if (option.label.toLowerCase().includes(inputValue.toLowerCase())) {
        items.push({ value: option.value, label: option.label })
      }
    } else if (isCustomOptionObject(option)) {
      if (option.label?.toLowerCase().includes(inputValue.toLowerCase()) ?? true) {
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
