'use client'

import React, { useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import { cn } from 'ui'
import { FilterGroup as FilterGroupComponent } from './FilterGroup'
import { FilterProperty, FilterGroup } from './types'
import {
  findConditionByPath,
  isAsyncOptionsFunction,
  removeFromGroup,
  updateNestedValue,
  updateNestedOperator,
  updateNestedLogicalOperator,
} from './utils'
import { useFilterBarState, useOptionsCache } from './hooks'
import { useKeyboardNavigation } from './useKeyboardNavigation'
import { useAIFilter } from './useAIFilter'
import { useCommandHandling } from './useCommandHandling'
import { MenuItem } from './menuItems'

export type FilterBarProps = {
  filterProperties: FilterProperty[]
  onFilterChange: (filters: FilterGroup) => void
  freeformText: string
  onFreeformTextChange: (freeformText: string) => void
  filters: FilterGroup
  aiApiUrl?: string
  className?: string
  supportsOperators?: boolean
}

export function FilterBar({
  filterProperties,
  filters: activeFilters,
  onFilterChange,
  freeformText,
  onFreeformTextChange,
  aiApiUrl,
  className,
  supportsOperators = false,
}: FilterBarProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const {
    isLoading,
    setIsLoading,
    error,
    setError,
    isCommandMenuVisible,
    setIsCommandMenuVisible,
    hideTimeoutRef,
    activeInput,
    setActiveInput,
    newPathRef,
  } = useFilterBarState()

  const {
    loadingOptions,
    propertyOptionsCache,
    loadPropertyOptions,
    optionsError,
    setOptionsError,
  } = useOptionsCache()

  const { handleAIFilter } = useAIFilter({
    activeInput,
    aiApiUrl,
    freeformText,
    filterProperties,
    activeFilters,
    onFilterChange,
    onFreeformTextChange,
    setIsLoading,
    setError,
    setIsCommandMenuVisible,
  })

  const handleInputChange = useCallback(
    (path: number[], value: string) => {
      const updatedFilters = updateNestedValue(activeFilters, path, value)
      onFilterChange(updatedFilters)

      // Load async options for this property when value changes
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
    [activeFilters, onFilterChange, filterProperties, loadPropertyOptions]
  )

  const handleOperatorChange = useCallback(
    (path: number[], value: string) => {
      const updatedFilters = updateNestedOperator(activeFilters, path, value)
      onFilterChange(updatedFilters)
    },
    [activeFilters, onFilterChange]
  )

  const { handleItemSelect } = useCommandHandling({
    activeInput,
    setActiveInput,
    activeFilters,
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
    activeFilters,
    onFilterChange,
  })

  const handleInputFocus = useCallback(
    (path: number[]) => {
      setActiveInput({ type: 'value', path })
      setIsCommandMenuVisible(true)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }

      // Load async options for this property
      const condition = findConditionByPath(activeFilters, path)
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
    [activeFilters, filterProperties, loadPropertyOptions]
  )

  const handleOperatorFocus = useCallback((path: number[]) => {
    setActiveInput({ type: 'operator', path })
    setIsCommandMenuVisible(true)
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
  }, [])

  const handleGroupFreeformFocus = useCallback((path: number[]) => {
    setActiveInput({ type: 'group', path })
    setIsCommandMenuVisible(true)
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
  }, [])

  const handleInputBlur = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
    // Defer and only clear active state if focus moved outside the entire FilterBar
    hideTimeoutRef.current = setTimeout(() => {
      const activeEl = document.activeElement as HTMLElement | null
      if (activeEl && rootRef.current && rootRef.current.contains(activeEl)) {
        return
      }
      setIsCommandMenuVisible(false)
      setActiveInput(null)
    }, 0)
  }, [setIsCommandMenuVisible, setActiveInput])

  const handleGroupFreeformChange = useCallback((path: number[], value: string) => {
    onFreeformTextChange(value)
  }, [])

  const handleLabelClick = useCallback((path: number[]) => {
    setActiveInput({ type: 'value', path })
  }, [])

  const handleLogicalOperatorChange = useCallback(
    (path: number[]) => {
      const updatedFilters = updateNestedLogicalOperator(activeFilters, path)
      onFilterChange(updatedFilters)
    },
    [activeFilters, onFilterChange]
  )

  const handleRemoveCondition = useCallback(
    (path: number[]) => {
      const updatedFilters = removeFromGroup(activeFilters, path)
      onFilterChange(updatedFilters)
      setActiveInput(null)
    },
    [activeFilters, onFilterChange, setActiveInput]
  )

  return (
    <div ref={rootRef} className="w-full space-y-2 relative" data-filterbar-root>
      <div
        className={cn(
          'relative flex items-center gap-2 w-full border rounded-md h-10 bg-foreground/[.026] cursor-text p-0 px-2 overflow-auto',
          className
        )}
      >
        <Search className="text-foreground-muted w-4 h-4 sticky left-0 shrink-0" />
        <div className="flex-1 flex flex-wrap items-center gap-1 h-full">
          <FilterGroupComponent
            group={activeFilters}
            rootFilters={activeFilters}
            filterProperties={filterProperties}
            path={[]}
            isLoading={isLoading}
            activeInput={activeInput}
            onOperatorChange={handleOperatorChange}
            onValueChange={handleInputChange}
            onOperatorFocus={handleOperatorFocus}
            onValueFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onLabelClick={handleLabelClick}
            onKeyDown={handleKeyDown}
            onGroupFreeformChange={handleGroupFreeformChange}
            onGroupFreeformFocus={handleGroupFreeformFocus}
            groupFreeformValue={freeformText}
            isGroupFreeformActive={Boolean(activeInput?.type === 'group')}
            onLogicalOperatorChange={supportsOperators ? handleLogicalOperatorChange : undefined}
            supportsOperators={supportsOperators}
            onRemove={handleRemoveCondition}
            propertyOptionsCache={propertyOptionsCache}
            loadingOptions={loadingOptions}
            aiApiUrl={aiApiUrl}
            onSelectMenuItem={(item: MenuItem) => handleItemSelect(item)}
            setActiveInput={setActiveInput}
          />
        </div>
      </div>
      {(error || optionsError) && (
        <div className="text-red-500 text-xs mt-1">{error || optionsError}</div>
      )}
    </div>
  )
}
