import { useCallback } from 'react'

import { ActiveInputState, FilterGroup, FilterProperty, MenuItem } from './types'
import { addFilterToGroup, addGroupToGroup, findGroupByPath, isCustomOptionObject } from './utils'

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
  setIsCommandMenuVisible,
}: {
  activeInput: ActiveInputState
  setActiveInput: (input: ActiveInputState) => void
  activeFilters: FilterGroup
  onFilterChange: (filters: FilterGroup) => void
  filterProperties: FilterProperty[]
  freeformText: string
  onFreeformTextChange: (text: string) => void
  handleInputChange: (path: number[], value: string) => void
  handleOperatorChange: (path: number[], value: string) => void
  newPathRef: React.MutableRefObject<number[]>
  setIsCommandMenuVisible: (visible: boolean) => void
}) {
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
  }, [activeInput, activeFilters, onFilterChange, newPathRef, setActiveInput, onFreeformTextChange])

  const handleValueCommand = useCallback(
    (item: MenuItem) => {
      if (!activeInput || activeInput.type !== 'value') return

      const path = activeInput.path
      handleInputChange(path, item.value)
      setTimeout(() => {
        setActiveInput({ type: 'group', path: path.slice(0, -1) })
      }, 0)
    },
    [activeInput, handleInputChange, setActiveInput]
  )

  const handleOperatorCommand = useCallback(
    (selectedValue: string) => {
      if (!activeInput || activeInput.type !== 'operator') return

      const path = activeInput.path
      handleOperatorChange(path, selectedValue)
      setActiveInput({ type: 'value', path })
    },
    [activeInput, handleOperatorChange, setActiveInput]
  )

  const handlePropertySelection = useCallback(
    (selectedProperty: FilterProperty, currentPath: number[], group: FilterGroup) => {
      const updatedFilters = addFilterToGroup(activeFilters, currentPath, selectedProperty)
      onFilterChange(updatedFilters)
      const newPath = [...currentPath, group.conditions.length]

      setTimeout(() => {
        setActiveInput({ type: 'operator', path: newPath })
      }, 0)
    },
    [activeFilters, onFilterChange, setActiveInput]
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

      if (
        selectedProperty.options &&
        !Array.isArray(selectedProperty.options) &&
        isCustomOptionObject(selectedProperty.options)
      ) {
        handlePropertySelection(selectedProperty, currentPath, group)
      } else {
        handlePropertySelection(selectedProperty, currentPath, group)
      }
      onFreeformTextChange('')
    },
    [activeInput, filterProperties, activeFilters, onFreeformTextChange, handlePropertySelection]
  )

  const handleItemSelect = useCallback(
    (item: MenuItem) => {
      const selectedValue = item.value
      if (item.isAction && item.action) {
        const path = activeInput?.type === 'group' ? activeInput.path : []
        Promise.resolve(
          item.action.onSelect(item.actionInputValue ?? freeformText ?? '', {
            path,
            activeFilters,
          })
        )
          .catch((error) => console.error('FilterBar action failed', error))
          .finally(() => {
            setIsCommandMenuVisible(false)
            setActiveInput(null)
          })
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
      freeformText,
      setActiveInput,
      handleGroupCommand,
      handleValueCommand,
      handleOperatorCommand,
      handleGroupPropertyCommand,
      setIsCommandMenuVisible,
    ]
  )

  return {
    handleItemSelect,
  }
}
