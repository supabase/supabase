'use client'

import React, { createContext, useContext, useRef, useCallback } from 'react'
import { FilterProperty, FilterGroup } from './types'
import { ActiveInput, useFilterBarState, useOptionsCache } from './hooks'
import { useKeyboardNavigation } from './useKeyboardNavigation'
import { useAIFilter } from './useAIFilter'
import { useCommandHandling } from './useCommandHandling'
import { MenuItem } from './menuItems'
import {
  findConditionByPath,
  isAsyncOptionsFunction,
  removeFromGroup,
  updateNestedValue,
  updateNestedOperator,
  updateNestedLogicalOperator,
} from './utils'

export type FilterBarContextValue = {
  // Core state
  filters: FilterGroup
  filterProperties: FilterProperty[]
  activeInput: ActiveInput
  freeformText: string
  isLoading: boolean
  error: string | null

  // Handlers
  onFilterChange: (filters: FilterGroup) => void
  onFreeformTextChange: (text: string) => void
  setActiveInput: (input: ActiveInput) => void
  handleInputChange: (path: number[], value: string) => void
  handleOperatorChange: (path: number[], value: string) => void
  handleRemoveCondition: (path: number[]) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleSelectMenuItem: (item: MenuItem) => void
  handleInputFocus: (path: number[]) => void
  handleOperatorFocus: (path: number[]) => void
  handleGroupFreeformFocus: (path: number[]) => void
  handleInputBlur: () => void
  handleGroupFreeformChange: (path: number[], value: string) => void
  handleLabelClick: (path: number[]) => void
  handleLogicalOperatorChange: (path: number[]) => void

  // Options cache
  propertyOptionsCache: Record<string, { options: any[]; searchValue: string }>
  loadingOptions: Record<string, boolean>
  loadPropertyOptions: (property: FilterProperty, search: string) => void
  optionsError: string | null

  // Config
  supportsOperators: boolean
  aiApiUrl?: string

  // Refs
  rootRef: React.RefObject<HTMLDivElement>
}

const FilterBarContext = createContext<FilterBarContextValue | null>(null)

export function useFilterBar() {
  const ctx = useContext(FilterBarContext)
  if (!ctx) {
    throw new Error('useFilterBar must be used within FilterBar.Root')
  }
  return ctx
}

export type FilterBarRootProps = {
  children: React.ReactNode
  filterProperties: FilterProperty[]
  filters: FilterGroup
  onFilterChange: (filters: FilterGroup) => void
  freeformText: string
  onFreeformTextChange: (text: string) => void
  aiApiUrl?: string
  supportsOperators?: boolean
}

export function FilterBarRoot({
  children,
  filterProperties,
  filters,
  onFilterChange,
  freeformText,
  onFreeformTextChange,
  aiApiUrl,
  supportsOperators = false,
}: FilterBarRootProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  const {
    isLoading,
    setIsLoading,
    error,
    setError,
    hideTimeoutRef,
    activeInput,
    setActiveInput,
    newPathRef,
    setIsCommandMenuVisible,
  } = useFilterBarState()

  const {
    loadingOptions,
    propertyOptionsCache,
    loadPropertyOptions,
    optionsError,
  } = useOptionsCache()

  const { handleAIFilter } = useAIFilter({
    activeInput,
    aiApiUrl,
    freeformText,
    filterProperties,
    activeFilters: filters,
    onFilterChange,
    onFreeformTextChange,
    setIsLoading,
    setError,
    setIsCommandMenuVisible,
  })

  const handleInputChange = useCallback(
    (path: number[], value: string) => {
      const updatedFilters = updateNestedValue(filters, path, value)
      onFilterChange(updatedFilters)

      const condition = findConditionByPath(updatedFilters, path)
      if (condition) {
        const property = filterProperties.find((p) => p.name === condition.propertyName)
        if (
          property &&
          property.options &&
          !Array.isArray(property.options) &&
          isAsyncOptionsFunction(property.options)
        ) {
          loadPropertyOptions(property, value)
        }
      }
    },
    [filters, onFilterChange, filterProperties, loadPropertyOptions]
  )

  const handleOperatorChange = useCallback(
    (path: number[], value: string) => {
      const updatedFilters = updateNestedOperator(filters, path, value)
      onFilterChange(updatedFilters)
    },
    [filters, onFilterChange]
  )

  const { handleItemSelect } = useCommandHandling({
    activeInput,
    setActiveInput,
    activeFilters: filters,
    onFilterChange,
    filterProperties,
    freeformText,
    onFreeformTextChange,
    handleInputChange,
    handleOperatorChange,
    newPathRef,
    handleAIFilter,
  })

  const { handleKeyDown } = useKeyboardNavigation({
    activeInput,
    setActiveInput,
    activeFilters: filters,
    onFilterChange,
  })

  const handleInputFocus = useCallback(
    (path: number[]) => {
      setActiveInput({ type: 'value', path })
      setIsCommandMenuVisible(true)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }

      const condition = findConditionByPath(filters, path)
      if (condition) {
        const property = filterProperties.find((p) => p.name === condition.propertyName)
        if (
          property &&
          property.options &&
          !Array.isArray(property.options) &&
          isAsyncOptionsFunction(property.options)
        ) {
          loadPropertyOptions(property, condition.value?.toString() || '')
        }
      }
    },
    [filters, filterProperties, loadPropertyOptions, setActiveInput, setIsCommandMenuVisible, hideTimeoutRef]
  )

  const handleOperatorFocus = useCallback(
    (path: number[]) => {
      setActiveInput({ type: 'operator', path })
      setIsCommandMenuVisible(true)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    },
    [setActiveInput, setIsCommandMenuVisible, hideTimeoutRef]
  )

  const handleGroupFreeformFocus = useCallback(
    (path: number[]) => {
      setActiveInput({ type: 'group', path })
      setIsCommandMenuVisible(true)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    },
    [setActiveInput, setIsCommandMenuVisible, hideTimeoutRef]
  )

  const handleInputBlur = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
    hideTimeoutRef.current = setTimeout(() => {
      const activeEl = document.activeElement as HTMLElement | null
      if (activeEl && rootRef.current && rootRef.current.contains(activeEl)) {
        return
      }
      setIsCommandMenuVisible(false)
      setActiveInput(null)
    }, 0)
  }, [setIsCommandMenuVisible, setActiveInput, hideTimeoutRef])

  const handleGroupFreeformChange = useCallback(
    (_path: number[], value: string) => {
      onFreeformTextChange(value)
    },
    [onFreeformTextChange]
  )

  const handleLabelClick = useCallback(
    (path: number[]) => {
      setActiveInput({ type: 'value', path })
    },
    [setActiveInput]
  )

  const handleLogicalOperatorChange = useCallback(
    (path: number[]) => {
      const updatedFilters = updateNestedLogicalOperator(filters, path)
      onFilterChange(updatedFilters)
    },
    [filters, onFilterChange]
  )

  const handleRemoveCondition = useCallback(
    (path: number[]) => {
      const updatedFilters = removeFromGroup(filters, path)
      onFilterChange(updatedFilters)
      setActiveInput(null)
    },
    [filters, onFilterChange, setActiveInput]
  )

  const contextValue: FilterBarContextValue = {
    // Core state
    filters,
    filterProperties,
    activeInput,
    freeformText,
    isLoading,
    error,

    // Handlers
    onFilterChange,
    onFreeformTextChange,
    setActiveInput,
    handleInputChange,
    handleOperatorChange,
    handleRemoveCondition,
    handleKeyDown,
    handleSelectMenuItem: handleItemSelect,
    handleInputFocus,
    handleOperatorFocus,
    handleGroupFreeformFocus,
    handleInputBlur,
    handleGroupFreeformChange,
    handleLabelClick,
    handleLogicalOperatorChange,

    // Options cache
    propertyOptionsCache,
    loadingOptions,
    loadPropertyOptions,
    optionsError,

    // Config
    supportsOperators,
    aiApiUrl,

    // Refs
    rootRef,
  }

  return (
    <FilterBarContext.Provider value={contextValue}>
      <div ref={rootRef} data-filterbar-root>
        {children}
      </div>
    </FilterBarContext.Provider>
  )
}

