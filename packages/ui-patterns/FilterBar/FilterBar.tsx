import React, { useRef, KeyboardEvent, useMemo, useState, useCallback, useEffect } from 'react'
import { Search, Sparkles } from 'lucide-react'
import {
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
} from 'ui'
import { FilterGroup as FilterGroupComponent } from './FilterGroup'
import { FilterProperty, FilterCondition, FilterGroup } from './types'

export type ActiveInput =
  | { type: 'value'; path: number[] }
  | { type: 'operator'; path: number[] }
  | { type: 'group'; path: number[] }
  | null

type FilterBarProps = {
  filterProperties: FilterProperty[]
  onFilterChange: (filters: FilterGroup) => void
  freeformText: string
  onFreeformTextChange: (freeformText: string) => void
  filters: FilterGroup
  aiApiUrl?: string
}

const isGroup = (condition: FilterCondition | FilterGroup): condition is FilterGroup => {
  return 'logicalOperator' in condition
}

export function FilterBar({
  filterProperties,
  filters: activeFilters,
  onFilterChange,
  freeformText,
  onFreeformTextChange,
  aiApiUrl,
}: FilterBarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const commandRef = useRef<HTMLDivElement>(null)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const [isCommandMenuVisible, setIsCommandMenuVisible] = useState(false)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [activeInput, setActiveInput] = useState<ActiveInput>(null)
  const newPathRef = useRef<number[]>([])
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({})
  const [propertyOptionsCache, setPropertyOptionsCache] = useState<
    Record<string, { options: string[]; searchValue: string }>
  >({})
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleInputChange = useCallback(
    (path: number[], value: string) => {
      const updateNestedValue = (
        group: FilterGroup,
        currentPath: number[],
        newValue: string
      ): FilterGroup => {
        if (currentPath.length === 1) {
          return {
            ...group,
            conditions: group.conditions.map((condition, i) =>
              i === currentPath[0] ? { ...condition, value: newValue } : condition
            ),
          }
        }

        const [current, ...rest] = currentPath
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

      const updatedFilters = updateNestedValue(activeFilters, path, value)
      onFilterChange(updatedFilters)
      setSelectedCommandIndex(0)
      setIsCommandMenuVisible(true)
    },
    [activeFilters]
  )

  const handleOperatorChange = useCallback(
    (path: number[], value: string) => {
      const updateNestedOperator = (
        group: FilterGroup,
        currentPath: number[],
        newOperator: string
      ): FilterGroup => {
        if (currentPath.length === 1) {
          return {
            ...group,
            conditions: group.conditions.map((condition, i) =>
              i === currentPath[0] ? { ...condition, operator: newOperator } : condition
            ),
          }
        }

        const [current, ...rest] = currentPath
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

      const updatedFilters = updateNestedOperator(activeFilters, path, value)
      onFilterChange(updatedFilters)
      setSelectedCommandIndex(0)
      setIsCommandMenuVisible(true)
    },
    [activeFilters]
  )

  const handleInputFocus = useCallback((path: number[]) => {
    setActiveInput({ type: 'value', path })
    setIsCommandMenuVisible(true)
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
  }, [])

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

  const handleAIFilter = async () => {
    if (!activeInput || activeInput.type !== 'group' || !aiApiUrl) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(aiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: freeformText,
          filterProperties,
          currentPath: activeInput.path,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'AI filtering failed')
      }

      const data = await response.json()
      console.log(data)
      if (!data || !Array.isArray(data.conditions)) {
        throw new Error('Invalid response from AI filter')
      }

      // Process the nested structure
      const processConditions = (conditions: any[]): any[] => {
        return conditions.map((condition) => {
          if (isGroup(condition)) {
            // This is a group
            return {
              logicalOperator: condition.logicalOperator,
              conditions: processConditions(condition.conditions),
            }
          } else {
            // This is a condition
            const matchedProperty = filterProperties.find(
              (prop) => prop.name === condition.propertyName
            )
            if (!matchedProperty) {
              throw new Error(`Invalid property: ${condition.propertyName}`)
            }
            return {
              propertyName: matchedProperty.name,
              value: condition.value,
              operator: condition.operator || '=',
            }
          }
        })
      }

      const processedGroup = {
        logicalOperator: data.logicalOperator || 'AND',
        conditions: processConditions(data.conditions),
      }

      // Update the active filters by replacing the group at the current path
      const updateGroupAtPath = (
        group: FilterGroup,
        path: number[],
        newGroup: FilterGroup
      ): FilterGroup => {
        if (path.length === 0) {
          return newGroup
        }

        const [current, ...rest] = path
        return {
          ...group,
          conditions: group.conditions.map((condition, index) =>
            index === current
              ? updateGroupAtPath(condition as FilterGroup, rest, newGroup)
              : condition
          ),
        }
      }

      const updatedFilters = updateGroupAtPath(activeFilters, activeInput.path, processedGroup)
      onFilterChange(updatedFilters)

      onFreeformTextChange('')
      setIsCommandMenuVisible(false)
    } catch (error: any) {
      console.error('Error in AI filtering:', error)
      setError(error.message || 'AI filtering failed. Please try again.')
      onFreeformTextChange('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGroupFreeformChange = useCallback((path: number[], value: string) => {
    onFreeformTextChange(value)
    setSelectedCommandIndex(0)
    setIsCommandMenuVisible(true)
  }, [])

  const addFilterToGroup = useCallback(
    (group: FilterGroup, path: number[], property: FilterProperty): FilterGroup => {
      if (path.length === 0) {
        return {
          ...group,
          conditions: [
            ...group.conditions,
            { propertyName: property.name, value: null, operator: '=' },
          ],
        }
      }

      const [current, ...rest] = path
      return {
        ...group,
        conditions: group.conditions.map((condition, i) =>
          i === current ? addFilterToGroup(condition as FilterGroup, rest, property) : condition
        ),
      }
    },
    []
  )

  const addGroupToGroup = useCallback((group: FilterGroup, path: number[]): FilterGroup => {
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
  }, [])

  const handleCommandSelect = (selectedValue: string) => {
    if (selectedValue === 'ai-filter') {
      handleAIFilter()
      return
    }

    if (selectedValue === 'group') {
      if (activeInput && activeInput.type === 'group') {
        const currentPath = activeInput.path
        const group = findGroupByPath(activeFilters, currentPath)
        if (!group) return

        const updatedFilters = addGroupToGroup(activeFilters, currentPath)
        onFilterChange(updatedFilters)
        // Store the new path for use after the state update
        newPathRef.current = [...currentPath, group.conditions.length]
        // Focus the new group's freeform input after the state update
        setTimeout(() => {
          setActiveInput({ type: 'group', path: newPathRef.current })
          setIsCommandMenuVisible(true)
        }, 0)
        onFreeformTextChange('')
      }
      return
    }

    if (activeInput && activeInput.type === 'value') {
      const path = activeInput.path
      handleInputChange(path, selectedValue)
      // Focus the parent group's input after setting the value
      setTimeout(() => {
        setActiveInput({ type: 'group', path: path.slice(0, -1) })
        setIsCommandMenuVisible(true)
      }, 0)
    } else if (activeInput && activeInput.type === 'operator') {
      const path = activeInput.path
      handleOperatorChange(path, selectedValue)
      setActiveInput(null)
    } else if (activeInput && activeInput.type === 'group') {
      const selectedProperty = filterProperties.find((prop) => prop.name === selectedValue)
      if (selectedProperty) {
        const currentPath = activeInput.path
        const group = findGroupByPath(activeFilters, currentPath)
        if (!group) return

        const updatedFilters = addFilterToGroup(activeFilters, currentPath, selectedProperty)
        onFilterChange(updatedFilters)
        // Store the new path for use after the state update
        newPathRef.current = [...currentPath, group.conditions.length]
        // Focus the new condition's value input after the state update
        setTimeout(() => {
          setActiveInput({ type: 'value', path: newPathRef.current })
          setIsCommandMenuVisible(true)
        }, 0)
        onFreeformTextChange('')
      } else {
        setError(`Invalid property: ${selectedValue}`)
      }
    }
  }

  const findConditionByPath = (group: FilterGroup, path: number[]): FilterCondition | null => {
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

  const loadPropertyOptions = useCallback(
    async (property: FilterProperty, search: string = '') => {
      if (!property.options || Array.isArray(property.options)) return

      // Check if we have cached options for this exact search
      const cached = propertyOptionsCache[property.name]
      if (cached && cached.searchValue === search) return

      // Clear any pending loads
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }

      // Debounce the load
      loadTimeoutRef.current = setTimeout(async () => {
        if (loadingOptions[property.name]) return // Prevent duplicate loads

        try {
          setLoadingOptions((prev) => ({ ...prev, [property.name]: true }))
          const options =
            typeof property.options === 'function' ? await property.options(search) : []
          setPropertyOptionsCache((prev) => ({
            ...prev,
            [property.name]: { options, searchValue: search },
          }))
        } catch (error) {
          console.error(`Error loading options for ${property.name}:`, error)
          setError(`Failed to load options for ${property.label}`)
        } finally {
          setLoadingOptions((prev) => ({ ...prev, [property.name]: false }))
        }
      }, 300) // Debounce time
    },
    [loadingOptions, propertyOptionsCache]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
  }, [])

  const commandItems = useMemo(() => {
    if (activeInput?.type === 'operator') {
      const condition = findConditionByPath(activeFilters, activeInput.path)
      const property = filterProperties.find((p) => p.name === condition?.propertyName)
      const operatorValue = condition?.operator?.toUpperCase() || ''
      const availableOperators = property?.operators || ['=']
      return availableOperators
        .filter((op) => op.toUpperCase().includes(operatorValue))
        .map((op) => ({ value: op, label: op, icon: undefined }))
    }

    const inputValue =
      activeInput?.type === 'group'
        ? freeformText
        : activeInput?.type === 'value'
          ? findConditionByPath(activeFilters, activeInput.path)?.value?.toString() || ''
          : ''

    const items: { value: string; label: string; icon?: React.ReactNode }[] = []

    if (activeInput?.type === 'group') {
      items.push(
        ...filterProperties
          .filter((prop) => prop.label.toLowerCase().includes(inputValue.toLowerCase()))
          .map((prop) => ({
            value: prop.name,
            label: prop.label,
            icon: undefined,
          }))
      )

      items.push({
        value: 'group',
        label: 'New Group',
        icon: undefined,
      })

      if (inputValue.trim().length > 0 && aiApiUrl) {
        items.push({
          value: 'ai-filter',
          label: 'Filter by AI',
          icon: <Sparkles className="mr-2 h-4 w-4" strokeWidth={1.25} />,
        })
      }
    } else if (activeInput?.type === 'value') {
      const activeCondition = findConditionByPath(activeFilters, activeInput.path)
      const property = filterProperties.find((p) => p.name === activeCondition?.propertyName)

      if (property) {
        if (loadingOptions[property.name]) {
          items.push({
            value: 'loading',
            label: 'Loading options...',
            icon: undefined,
          })
        } else if (Array.isArray(property.options)) {
          items.push(
            ...property.options
              .filter((option) => option.toLowerCase().includes(inputValue.toLowerCase()))
              .map((option) => ({
                value: option,
                label: option,
                icon: undefined,
              }))
          )
        } else if (propertyOptionsCache[property.name]) {
          items.push(
            ...propertyOptionsCache[property.name].options
              .filter((option) => option.toLowerCase().includes(inputValue.toLowerCase()))
              .map((option) => ({
                value: option,
                label: option,
                icon: undefined,
              }))
          )
        }

        // Load options if not cached or if search value has changed
        if (
          typeof property.options === 'function' &&
          !loadingOptions[property.name] &&
          (!propertyOptionsCache[property.name] ||
            propertyOptionsCache[property.name].searchValue !== inputValue)
        ) {
          loadPropertyOptions(property, inputValue)
        }
      }
    }

    return items
  }, [
    activeInput,
    freeformText,
    activeFilters,
    filterProperties,
    propertyOptionsCache,
    loadingOptions,
    loadPropertyOptions,
  ])

  const removeFilterByPath = useCallback(
    (path: number[]) => {
      const removeFromGroup = (group: FilterGroup, currentPath: number[]): FilterGroup => {
        if (currentPath.length === 1) {
          return {
            ...group,
            conditions: group.conditions.filter((_, i) => i !== currentPath[0]),
          }
        }

        const [current, ...rest] = currentPath
        return {
          ...group,
          conditions: group.conditions.map((condition, i) =>
            i === current ? removeFromGroup(condition as FilterGroup, rest) : condition
          ),
        }
      }

      const updatedFilters = removeFromGroup(activeFilters, path)
      onFilterChange(updatedFilters)
    },
    [activeFilters]
  )

  const removeGroupByPath = useCallback(
    (path: number[]) => {
      const removeFromGroup = (group: FilterGroup, currentPath: number[]): FilterGroup => {
        if (currentPath.length === 1) {
          return {
            ...group,
            conditions: group.conditions.filter((_, i) => i !== currentPath[0]),
          }
        }

        const [current, ...rest] = currentPath
        return {
          ...group,
          conditions: group.conditions.map((condition, i) =>
            i === current ? removeFromGroup(condition as FilterGroup, rest) : condition
          ),
        }
      }

      const updatedFilters = removeFromGroup(activeFilters, path)
      onFilterChange(updatedFilters)
    },
    [activeFilters]
  )

  const findGroupByPath = (group: FilterGroup, path: number[]): FilterGroup | null => {
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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedCommandIndex((prevIndex) =>
        prevIndex < commandItems.length - 1 ? prevIndex + 1 : prevIndex
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedCommandIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (commandItems[selectedCommandIndex]) {
        handleCommandSelect(commandItems[selectedCommandIndex].value)
      }
    } else if (e.key === 'Backspace') {
      // Skip backspace handling for operator inputs
      if (activeInput?.type === 'operator') return

      const inputElement = e.target as HTMLInputElement
      const isEmpty = inputElement.value === ''

      if (activeInput?.type === 'group' && isEmpty) {
        e.preventDefault()
        const group = findGroupByPath(activeFilters, activeInput.path)

        if (group && group.conditions.length > 0) {
          // Remove the last condition in the group
          const lastConditionPath = [...activeInput.path, group.conditions.length - 1]
          removeFilterByPath(lastConditionPath)
          // Keep focus on the group's input
          setActiveInput({ type: 'group', path: activeInput.path })
        } else if (group && group.conditions.length === 0) {
          // Remove the empty group
          removeGroupByPath(activeInput.path)

          // Focus the parent group's freeform input
          if (activeInput.path.length > 0) {
            setActiveInput({
              type: 'group',
              path: activeInput.path.slice(0, -1),
            })
          } else {
            setActiveInput(null)
          }
        }
      } else if (activeInput?.type === 'value' && isEmpty) {
        const condition = findConditionByPath(activeFilters, activeInput.path)
        if (condition && !condition.value) {
          e.preventDefault()
          removeFilterByPath(activeInput.path)

          // Focus the group's input
          setActiveInput({
            type: 'group',
            path: activeInput.path.slice(0, -1),
          })
        }
      }
    } else if (e.key === ' ' && activeInput?.type === 'value') {
      e.preventDefault()
      setActiveInput({ type: 'group', path: [] })
    } else if (e.key === 'ArrowLeft') {
      const inputElement = e.target as HTMLInputElement
      if (inputElement.selectionStart === 0) {
        e.preventDefault()
        if (activeInput?.type === 'value') {
          const lastIndex = activeInput.path[activeInput.path.length - 1]
          if (lastIndex > 0) {
            setActiveInput({
              type: 'value',
              path: [...activeInput.path.slice(0, -1), lastIndex - 1],
            })
          } else {
            setActiveInput({
              type: 'operator',
              path: activeInput.path,
            })
          }
        } else if (activeInput?.type === 'group') {
          const group = findGroupByPath(activeFilters, activeInput.path)
          if (group && group.conditions.length > 0) {
            // If the group has conditions, select the last one
            const lastConditionPath = [...activeInput.path, group.conditions.length - 1]
            setActiveInput({ type: 'value', path: lastConditionPath })
          } else if (activeInput.path.length > 0) {
            // If no conditions but has parent, select parent group's input
            setActiveInput({
              type: 'group',
              path: activeInput.path.slice(0, -1),
            })
          }
        }
      }
    } else if (e.key === 'ArrowRight') {
      const inputElement = e.target as HTMLInputElement
      if (inputElement.selectionStart === inputElement.value.length) {
        e.preventDefault()
        if (activeInput?.type === 'value') {
          const group = findGroupByPath(activeFilters, activeInput.path.slice(0, -1))
          const lastIndex = activeInput.path[activeInput.path.length - 1]
          if (group && lastIndex < group.conditions.length - 1) {
            setActiveInput({
              type: 'value',
              path: [...activeInput.path.slice(0, -1), lastIndex + 1],
            })
          } else {
            setActiveInput({
              type: 'group',
              path: activeInput.path.slice(0, -1),
            })
          }
        } else if (activeInput?.type === 'operator') {
          setActiveInput({ type: 'value', path: activeInput.path })
        }
      }
    } else if (e.key === 'Escape') {
      setIsCommandMenuVisible(false)
      setActiveInput(null)
    }
  }

  const handleLabelClick = useCallback((path: number[]) => {
    setActiveInput({ type: 'value', path })
  }, [])

  const handleLogicalOperatorChange = useCallback(
    (path: number[]) => {
      const updateNestedLogicalOperator = (
        group: FilterGroup,
        currentPath: number[]
      ): FilterGroup => {
        if (currentPath.length === 0) {
          return {
            ...group,
            logicalOperator: group.logicalOperator === 'AND' ? 'OR' : 'AND',
          }
        }

        const [current, ...rest] = currentPath
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

      const updatedFilters = updateNestedLogicalOperator(activeFilters, path)
      onFilterChange(updatedFilters)
    },
    [activeFilters]
  )

  return (
    <div className="w-full space-y-2 relative">
      <div className="relative flex items-center w-full rounded-md border border-control bg-foreground/[.026]">
        <Search className="absolute left-1 top-1/2 transform -translate-y-1/2 text-foreground-muted w-4 h-4" />
        <div className="flex-1 flex flex-wrap items-center pl-6 pr-1 py-1 gap-1 h-full">
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
            isGroupFreeformActive={activeInput?.type === 'group' ?? false}
            onLogicalOperatorChange={handleLogicalOperatorChange}
          />
        </div>
      </div>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      {isCommandMenuVisible && !isLoading && activeInput !== null && commandItems.length > 0 && (
        <Command_Shadcn_ ref={commandRef} className="absolute z-10 w-full h-auto shadow-md">
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
    </div>
  )
}
