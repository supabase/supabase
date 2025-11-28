import { useCallback } from 'react'
import { ActiveInput } from './hooks'
import { FilterProperty, FilterGroup } from './types'
import {
  findGroupByPath,
  addFilterToGroup,
  addGroupToGroup,
  isCustomOptionObject,
  updateNestedValue,
  removeFromGroup,
} from './utils'

import { MenuItem } from './menuItems'

export function useCommandHandling({
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
}: {
  activeInput: ActiveInput
  setActiveInput: (input: ActiveInput) => void
  activeFilters: FilterGroup
  onFilterChange: (filters: FilterGroup) => void
  filterProperties: FilterProperty[]
  freeformText: string
  onFreeformTextChange: (text: string) => void
  handleInputChange: (path: number[], value: string) => void
  handleOperatorChange: (path: number[], value: string) => void
  newPathRef: React.MutableRefObject<number[]>
  handleAIFilter: () => void
}) {
  const removeFilterByPath = useCallback(
    (path: number[]) => {
      const updatedFilters = removeFromGroup(activeFilters, path)
      onFilterChange(updatedFilters)
    },
    [activeFilters, onFilterChange]
  )

  const handleItemSelect = useCallback(
    (item: MenuItem) => {
      const selectedValue = item.value
      if (item.value === 'ai-filter') {
        handleAIFilter()
        return
      }

      if (item.value === 'group') {
        handleGroupCommand()
        return
      }

      if (activeInput?.type === 'value') {
        handleValueCommand(item)
      } else if (activeInput?.type === 'operator') {
        handleOperatorCommand(selectedValue)
      } else if (activeInput?.type === 'group') {
        handleGroupPropertyCommand(selectedValue)
      }
    },
    [
      activeInput,
      activeFilters,
      filterProperties,
      freeformText,
      handleAIFilter,
      handleInputChange,
      handleOperatorChange,
    ]
  )

  const handleGroupCommand = useCallback(() => {
    if (activeInput && activeInput.type === 'group') {
      const currentPath = activeInput.path
      const group = findGroupByPath(activeFilters, currentPath)
      if (!group) return

      const updatedFilters = addGroupToGroup(activeFilters, currentPath)
      onFilterChange(updatedFilters)
      newPathRef.current = [...currentPath, group.conditions.length]
      setTimeout(() => {
        setActiveInput({ type: 'group', path: newPathRef.current })
      }, 0)
      onFreeformTextChange('')
    }
  }, [activeInput, activeFilters, onFilterChange, setActiveInput, onFreeformTextChange])

  const handleValueCommand = useCallback(
    (item: MenuItem) => {
      if (!activeInput || activeInput.type !== 'value') return

      const path = activeInput.path

      // Custom value handled inline in popover; do nothing here

      // Handle regular options
      handleInputChange(path, item.value)
      setTimeout(() => {
        setActiveInput({ type: 'group', path: path.slice(0, -1) })
      }, 0)
    },
    [activeInput, handleInputChange, setActiveInput, removeFilterByPath]
  )

  const handleOperatorCommand = useCallback(
    (selectedValue: string) => {
      if (!activeInput || activeInput.type !== 'operator') return

      const path = activeInput.path
      handleOperatorChange(path, selectedValue)
      setActiveInput(null)
    },
    [activeInput, handleOperatorChange, setActiveInput]
  )

  const handleGroupPropertyCommand = useCallback(
    (selectedValue: string) => {
      if (!activeInput || activeInput.type !== 'group') return

      const selectedProperty = filterProperties.find((p) => p.name === selectedValue)
      if (!selectedProperty) {
        console.error(`Invalid property: ${selectedValue}`)
        return
      }

      const currentPath = activeInput.path
      const group = findGroupByPath(activeFilters, currentPath)
      if (!group) return

      // Check if the property itself is a custom option object
      if (
        selectedProperty.options &&
        !Array.isArray(selectedProperty.options) &&
        isCustomOptionObject(selectedProperty.options)
      ) {
        handleCustomPropertySelection(selectedProperty, currentPath, group)
      } else {
        handleNormalPropertySelection(selectedProperty, currentPath, group)
      }
      onFreeformTextChange('')
    },
    [activeInput, filterProperties, activeFilters, onFilterChange, onFreeformTextChange]
  )

  const handleCustomPropertySelection = useCallback(
    (selectedProperty: FilterProperty, currentPath: number[], group: FilterGroup) => {
      const updatedFilters = addFilterToGroup(activeFilters, currentPath, selectedProperty)
      onFilterChange(updatedFilters)
      const newPath = [...currentPath, group.conditions.length]

      // Focus the newly added condition's value input so its popover opens immediately
      setTimeout(() => {
        setActiveInput({ type: 'value', path: newPath })
      }, 0)
    },
    [activeFilters, onFilterChange, setActiveInput, removeFilterByPath]
  )

  const handleNormalPropertySelection = useCallback(
    (selectedProperty: FilterProperty, currentPath: number[], group: FilterGroup) => {
      const updatedFilters = addFilterToGroup(activeFilters, currentPath, selectedProperty)
      onFilterChange(updatedFilters)
      const newPath = [...currentPath, group.conditions.length]

      setTimeout(() => {
        setActiveInput({ type: 'value', path: newPath })
      }, 0)
    },
    [activeFilters, onFilterChange, setActiveInput]
  )

  return {
    handleItemSelect,
  }
}
