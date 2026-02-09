import { Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import * as React from 'react'

import { ActiveInput } from './hooks'
import { FilterGroup, FilterProperty } from './types'
import {
  findConditionByPath,
  isCustomOptionObject,
  isFilterOperatorObject,
  isFilterOptionObject,
} from './utils'

// Deprecated soon; kept for compatibility during refactor

export type CommandItem = {
  value: string
  label: string
  icon?: React.ReactNode
  isCustom?: boolean
  customOption?: (props: any) => React.ReactElement
}

export function useCommandMenu({
  activeInput,
  freeformText,
  activeFilters,
  filterProperties,
  propertyOptionsCache,
  loadingOptions,
  aiApiUrl,
  supportsOperators,
}: {
  activeInput: ActiveInput
  freeformText: string
  activeFilters: FilterGroup
  filterProperties: FilterProperty[]
  propertyOptionsCache: Record<string, { options: any[]; searchValue: string }>
  loadingOptions: Record<string, boolean>
  aiApiUrl?: string
  supportsOperators: boolean
}) {
  const commandItems = useMemo(() => {
    if (activeInput?.type === 'operator') {
      return getOperatorItems(activeInput, activeFilters, filterProperties)
    }

    const inputValue = getInputValue(activeInput, freeformText, activeFilters)
    const items: CommandItem[] = []

    if (activeInput?.type === 'group') {
      items.push(...getPropertyItems(filterProperties, inputValue))

      if (supportsOperators) {
        items.push({
          value: 'group',
          label: 'New Group',
        })
      }

      if (inputValue.trim().length > 0 && aiApiUrl) {
        items.push({
          value: 'ai-filter',
          label: 'Filter by AI',
          icon: React.createElement(Sparkles, { className: 'mr-2 h-4 w-4', strokeWidth: 1.25 }),
        })
      }
    } else if (activeInput?.type === 'value') {
      items.push(
        ...getValueItems(
          activeInput,
          activeFilters,
          filterProperties,
          propertyOptionsCache,
          loadingOptions,
          inputValue
        )
      )
    }

    return items
  }, [
    activeInput,
    freeformText,
    activeFilters,
    filterProperties,
    propertyOptionsCache,
    loadingOptions,
    aiApiUrl,
    supportsOperators,
  ])

  return { commandItems }
}

function getOperatorItems(
  activeInput: Extract<ActiveInput, { type: 'operator' }>,
  activeFilters: FilterGroup,
  filterProperties: FilterProperty[]
): CommandItem[] {
  const condition = findConditionByPath(activeFilters, activeInput.path)
  const property = filterProperties.find((p) => p.name === condition?.propertyName)
  const operatorValue = condition?.operator?.toUpperCase() || ''
  const availableOperators = property?.operators || ['=']

  return availableOperators
    .filter((op) => {
      const searchText = isFilterOperatorObject(op) ? op.value : op
      return searchText.toUpperCase().includes(operatorValue)
    })
    .map((op) => {
      if (isFilterOperatorObject(op)) {
        return { value: op.value, label: op.label }
      }
      return { value: op, label: op }
    })
}

function getInputValue(
  activeInput: ActiveInput,
  freeformText: string,
  activeFilters: FilterGroup
): string {
  return activeInput?.type === 'group'
    ? freeformText
    : activeInput?.type === 'value'
      ? (findConditionByPath(activeFilters, activeInput.path)?.value ?? '').toString()
      : ''
}

function getPropertyItems(filterProperties: FilterProperty[], inputValue: string): CommandItem[] {
  return filterProperties
    .filter((prop) => prop.label.toLowerCase().includes(inputValue.toLowerCase()))
    .map((prop) => ({
      value: prop.name,
      label: prop.label,
    }))
}

function getValueItems(
  activeInput: Extract<ActiveInput, { type: 'value' }>,
  activeFilters: FilterGroup,
  filterProperties: FilterProperty[],
  propertyOptionsCache: Record<string, { options: any[]; searchValue: string }>,
  loadingOptions: Record<string, boolean>,
  inputValue: string
): CommandItem[] {
  const activeCondition = findConditionByPath(activeFilters, activeInput.path)
  const property = filterProperties.find((p) => p.name === activeCondition?.propertyName)
  const items: CommandItem[] = []

  if (!property) return items

  // Handle custom option object at property level
  if (!Array.isArray(property.options) && isCustomOptionObject(property.options)) {
    items.push({
      value: 'custom',
      label: property.options.label || 'Custom...',
      isCustom: true,
      customOption: property.options.component,
    })
  } else if (loadingOptions[property.name]) {
    items.push({
      value: 'loading',
      label: 'Loading options...',
    })
  } else if (Array.isArray(property.options)) {
    items.push(...getArrayOptionItems(property.options, inputValue))
  } else if (propertyOptionsCache[property.name]) {
    items.push(...getCachedOptionItems(propertyOptionsCache[property.name].options))
  }

  return items
}

function getArrayOptionItems(options: any[], inputValue: string): CommandItem[] {
  const items: CommandItem[] = []

  for (const option of options) {
    if (typeof option === 'string') {
      if (option.toLowerCase().includes(inputValue.toLowerCase())) {
        items.push({
          value: option,
          label: option,
        })
      }
    } else if (isFilterOptionObject(option)) {
      if (option.label.toLowerCase().includes(inputValue.toLowerCase())) {
        items.push({
          value: option.value,
          label: option.label,
        })
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

function getCachedOptionItems(options: any[]): CommandItem[] {
  return options.map((option) => {
    if (typeof option === 'string') {
      return {
        value: option,
        label: option,
      }
    }
    return {
      value: option.value,
      label: option.label,
    }
  })
}
