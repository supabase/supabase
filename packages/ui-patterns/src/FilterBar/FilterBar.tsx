'use client'

import React, { useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import {
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Dialog,
  DialogContent,
} from 'ui'
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
import { useCommandMenu } from './useCommandMenu'
import { useAIFilter } from './useAIFilter'
import { useCommandHandling } from './useCommandHandling'

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
  const commandRef = useRef<HTMLDivElement>(null)
  const {
    isLoading,
    setIsLoading,
    error,
    setError,
    selectedCommandIndex,
    setSelectedCommandIndex,
    isCommandMenuVisible,
    setIsCommandMenuVisible,
    hideTimeoutRef,
    activeInput,
    setActiveInput,
    newPathRef,
    dialogContent,
    setDialogContent,
    isDialogOpen,
    setIsDialogOpen,
    pendingPath,
    setPendingPath,
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

  const { commandItems } = useCommandMenu({
    activeInput,
    freeformText,
    activeFilters,
    filterProperties,
    propertyOptionsCache,
    loadingOptions,
    aiApiUrl,
    supportsOperators,
  })

  const handleInputChange = useCallback(
    (path: number[], value: string) => {
      const updatedFilters = updateNestedValue(activeFilters, path, value)
      onFilterChange(updatedFilters)
      setSelectedCommandIndex(0)
      setIsCommandMenuVisible(true)

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
    [
      activeFilters,
      onFilterChange,
      setSelectedCommandIndex,
      setIsCommandMenuVisible,
      filterProperties,
      loadPropertyOptions,
    ]
  )

  const handleOperatorChange = useCallback(
    (path: number[], value: string) => {
      const updatedFilters = updateNestedOperator(activeFilters, path, value)
      onFilterChange(updatedFilters)
      setSelectedCommandIndex(0)
      setIsCommandMenuVisible(true)
    },
    [activeFilters, onFilterChange, setSelectedCommandIndex, setIsCommandMenuVisible]
  )

  const { handleCommandSelect } = useCommandHandling({
    activeInput,
    setActiveInput,
    activeFilters,
    onFilterChange,
    filterProperties,
    freeformText,
    onFreeformTextChange,
    handleInputChange,
    handleOperatorChange,
    setIsCommandMenuVisible,
    setDialogContent,
    setIsDialogOpen,
    setPendingPath,
    newPathRef,
    handleAIFilter,
    commandItems,
  })

  const { handleKeyDown } = useKeyboardNavigation({
    activeInput,
    setActiveInput,
    activeFilters,
    onFilterChange,
    setSelectedCommandIndex,
    selectedCommandIndex,
    setIsCommandMenuVisible,
    commandItems,
    handleCommandSelect,
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
    hideTimeoutRef.current = setTimeout(() => {
      setIsCommandMenuVisible(false)
      setActiveInput(null)
    }, 150)
  }, [])

  const handleGroupFreeformChange = useCallback((path: number[], value: string) => {
    onFreeformTextChange(value)
    setSelectedCommandIndex(0)
    setIsCommandMenuVisible(true)
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
      setIsCommandMenuVisible(false)
    },
    [activeFilters, onFilterChange, setActiveInput, setIsCommandMenuVisible]
  )

  return (
    <div className="w-full space-y-2 relative">
      <div
        className={cn(
          'relative flex items-center gap-2 w-full border rounded-md h-10 cursor-text p-0 pl-2',
          className
        )}
      >
        <Search className="text-foreground-muted w-4 h-4" />
        <div className="flex-1 flex flex-wrap items-center gap-1 h-full">
          <FilterGroupComponent
            group={activeFilters}
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
          />
        </div>
      </div>
      {(error || optionsError) && (
        <div className="text-red-500 text-xs mt-1">{error || optionsError}</div>
      )}
      {isCommandMenuVisible && !isLoading && activeInput !== null && commandItems.length > 0 && (
        <Command_Shadcn_ ref={commandRef} className="absolute z-10 h-auto shadow-md">
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              {commandItems.map((item, index) => (
                <CommandItem_Shadcn_
                  key={item.value}
                  onSelect={() => handleCommandSelect(item.value)}
                  className={`text-xs font-mono ${
                    index === selectedCommandIndex ? 'bg-surface-400' : ''
                  }`}
                >
                  {item.icon}
                  {item.label}
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      )}
      <Dialog open={isDialogOpen} onOpenChange={(open: boolean) => setIsDialogOpen(open)}>
        <DialogContent hideClose className="!w-fit max-w-screen">
          {dialogContent}
        </DialogContent>
      </Dialog>
    </div>
  )
}
