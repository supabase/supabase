'use client'

import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'

import { useFilterBarState, useOptionsCache } from './hooks'
import {
  ActiveInputState,
  FilterBarAction,
  FilterGroup,
  FilterOptionObject,
  FilterProperty,
  MenuItem,
} from './types'
import { useCommandHandling } from './useCommandHandling'
import { useKeyboardNavigation } from './useKeyboardNavigation'
import {
  findConditionByPath,
  isAsyncOptionsFunction,
  removeFromGroup,
  resolvePropertyChange,
  updateNestedLogicalOperator,
  updateNestedOperator,
  updateNestedPropertyName,
  updateNestedValue,
} from './utils'

export type FilterBarContextValue = {
  filters: FilterGroup
  filterProperties: FilterProperty[]
  activeInput: ActiveInputState
  freeformText: string
  isLoading: boolean
  error: string | null
  highlightedConditionPath: number[] | null

  onFilterChange: (filters: FilterGroup) => void
  commitFilters: (filters: FilterGroup) => void
  onFreeformTextChange: (text: string) => void
  setActiveInput: (input: ActiveInputState) => void
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
  handlePropertyChange: (path: number[], newPropertyName: string) => void
  handleLogicalOperatorChange: (path: number[]) => void

  propertyOptionsCache: Record<
    string,
    { options: (string | FilterOptionObject)[]; searchValue: string }
  >
  loadingOptions: Record<string, boolean>
  loadPropertyOptions: (property: FilterProperty, search: string) => void
  optionsError: string | null

  supportsOperators: boolean
  variant: FilterBarVariant
  actions?: FilterBarAction[]
  icon?: React.ReactNode
  freeformDefaultProperty?: string

  rootRef: React.RefObject<HTMLDivElement | null>
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
  onApply?: (filters: FilterGroup) => void
  freeformText: string
  onFreeformTextChange: (text: string) => void
  actions?: FilterBarAction[]
  isLoading?: boolean
  supportsOperators?: boolean
  variant?: FilterBarVariant
  icon?: React.ReactNode
  freeformDefaultProperty?: string
}

export type FilterBarVariant = 'default' | 'pill'

export type FilterBarHandle = {
  focus: () => void
}

export const FilterBarRoot = forwardRef<FilterBarHandle, FilterBarRootProps>(function FilterBarRoot(
  {
    children,
    filterProperties,
    filters,
    onFilterChange,
    onApply,
    freeformText,
    onFreeformTextChange,
    actions,
    isLoading: externalLoading,
    supportsOperators = false,
    variant = 'default',
    icon,
    freeformDefaultProperty,
  }: FilterBarRootProps,
  ref: React.Ref<FilterBarHandle>
) {
  const rootRef = useRef<HTMLDivElement>(null)

  // Keep latest onApply in a ref so commitFilters/handleInputBlur don't need to be re-created
  // (and downstream callbacks don't churn) when only the consumer's onApply identity changes.
  const onApplyRef = useRef(onApply)
  useEffect(() => {
    onApplyRef.current = onApply
  }, [onApply])

  const filtersRef = useRef(filters)
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  const commitFilters = useCallback(
    (next: FilterGroup) => {
      onFilterChange(next)
      onApplyRef.current?.(next)
    },
    [onFilterChange]
  )

  const {
    isLoading,
    error,
    hideTimeoutRef,
    activeInput,
    setActiveInput,
    newPathRef,
    setIsCommandMenuVisible,
    highlightedConditionPath,
    setHighlightedConditionPath,
  } = useFilterBarState()

  const { loadingOptions, propertyOptionsCache, loadPropertyOptions, optionsError } =
    useOptionsCache()

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
      commitFilters(updatedFilters)
    },
    [filters, commitFilters]
  )

  const { handleItemSelect } = useCommandHandling({
    activeInput,
    setActiveInput,
    activeFilters: filters,
    onFilterChange,
    commitFilters,
    filterProperties,
    freeformText,
    onFreeformTextChange,
    handleOperatorChange,
    newPathRef,
    setIsCommandMenuVisible,
  })

  const { handleKeyDown } = useKeyboardNavigation({
    activeInput,
    setActiveInput,
    activeFilters: filters,
    commitFilters,
    highlightedConditionPath,
    setHighlightedConditionPath,
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
    [
      filters,
      filterProperties,
      loadPropertyOptions,
      setActiveInput,
      setIsCommandMenuVisible,
      hideTimeoutRef,
    ]
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
      setHighlightedConditionPath(null)
      // Focus has actually left the FilterBar — fire onApply with the latest filters so any
      // value typed but never confirmed via Enter still gets pushed downstream.
      onApplyRef.current?.(filtersRef.current)
    }, 0)
  }, [setIsCommandMenuVisible, setActiveInput, hideTimeoutRef, setHighlightedConditionPath])

  const handleGroupFreeformChange = useCallback(
    (_path: number[], value: string) => {
      if (highlightedConditionPath) {
        setHighlightedConditionPath(null)
      }
      onFreeformTextChange(value)
    },
    [onFreeformTextChange, highlightedConditionPath, setHighlightedConditionPath]
  )

  const handleLabelClick = useCallback(
    (path: number[]) => {
      setActiveInput({ type: 'property', path })
      setIsCommandMenuVisible(true)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    },
    [setActiveInput, setIsCommandMenuVisible, hideTimeoutRef]
  )

  const handlePropertyChange = useCallback(
    (path: number[], newPropertyName: string) => {
      const condition = findConditionByPath(filters, path)
      if (!condition) return

      const newProperty = filterProperties.find((p) => p.name === newPropertyName)
      if (!newProperty) return

      const { operator, value, focusTarget } = resolvePropertyChange(
        condition.operator,
        (condition.value ?? '').toString(),
        newProperty
      )

      const updatedFilters = updateNestedPropertyName(
        filters,
        path,
        newPropertyName,
        operator,
        value
      )
      commitFilters(updatedFilters)
      setActiveInput({ type: focusTarget, path })
    },
    [filters, filterProperties, commitFilters, setActiveInput]
  )

  const handleLogicalOperatorChange = useCallback(
    (path: number[]) => {
      const updatedFilters = updateNestedLogicalOperator(filters, path)
      commitFilters(updatedFilters)
    },
    [filters, commitFilters]
  )

  const handleRemoveCondition = useCallback(
    (path: number[]) => {
      const updatedFilters = removeFromGroup(filters, path)
      commitFilters(updatedFilters)
      setActiveInput(null)
    },
    [filters, commitFilters, setActiveInput]
  )

  // Cleanup hideTimeoutRef on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [hideTimeoutRef])

  const loading = externalLoading ?? isLoading

  const contextValue: FilterBarContextValue = {
    filters,
    filterProperties,
    activeInput,
    freeformText,
    isLoading: loading,
    error,
    highlightedConditionPath,

    onFilterChange,
    commitFilters,
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
    handlePropertyChange,
    handleLogicalOperatorChange,

    propertyOptionsCache,
    loadingOptions,
    loadPropertyOptions,
    optionsError,

    supportsOperators,
    variant,
    actions,
    icon,
    freeformDefaultProperty,

    rootRef,
  }

  useImperativeHandle(ref, () => ({
    focus: () => handleGroupFreeformFocus([]),
  }))

  return (
    <FilterBarContext.Provider value={contextValue}>
      <div ref={rootRef} data-filterbar-root className="h-full min-h-[32px] flex items-stretch">
        {children}
      </div>
    </FilterBarContext.Provider>
  )
})
