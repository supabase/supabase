import { useCallback } from 'react'

import { ActiveInputState, FilterGroup, FilterProperty, MenuItem } from './types'
import {
  addFilterToGroup,
  addGroupToGroup,
  findGroupByPath,
  isFilterOperatorObject,
  updateNestedOperator,
  updateNestedValue,
} from './utils'

export function useCommandHandling({
  activeInput,
  setActiveInput,
  activeFilters,
  onFilterChange,
  commitFilters,
  filterProperties,
  freeformText,
  onFreeformTextChange,
  handleOperatorChange,
  newPathRef,
  setIsCommandMenuVisible,
}: {
  activeInput: ActiveInputState
  setActiveInput: (input: ActiveInputState) => void
  activeFilters: FilterGroup
  onFilterChange: (filters: FilterGroup) => void
  commitFilters: (filters: FilterGroup) => void
  filterProperties: FilterProperty[]
  freeformText: string
  onFreeformTextChange: (text: string) => void
  handleOperatorChange: (path: number[], value: string) => void
  newPathRef: React.MutableRefObject<number[]>
  setIsCommandMenuVisible: (visible: boolean) => void
}) {
  const handleGroupCommand = useCallback(() => {
    if (activeInput && activeInput.type === 'group') {
      const currentPath = activeInput.path
      const group = findGroupByPath(activeFilters, currentPath)
      if (!group) return

      // Group-add is structural (no value typed yet), so update draft state only — onApply will
      // fire once a value gets committed inside the new group.
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
      const updated = updateNestedValue(activeFilters, path, item.value)
      commitFilters(updated)
      setTimeout(() => {
        setActiveInput({ type: 'group', path: path.slice(0, -1) })
      }, 0)
    },
    [activeInput, activeFilters, commitFilters, setActiveInput]
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
      // Adding a new condition stub (property only, no operator/value yet) is structural —
      // draft-only. onApply fires once the user picks an operator or value.
      let updatedFilters = addFilterToGroup(activeFilters, currentPath, selectedProperty)
      const newPath = [...currentPath, group.conditions.length]

      // If the property only allows a single operator, pre-fill it and skip the operator step —
      // the user otherwise has to hit Enter on a one-item dropdown before they can type a value.
      const operators = selectedProperty.operators ?? []
      const onlyOperator =
        operators.length === 1
          ? isFilterOperatorObject(operators[0])
            ? operators[0].value
            : operators[0]
          : null

      if (onlyOperator) {
        updatedFilters = updateNestedOperator(updatedFilters, newPath, onlyOperator)
      }
      onFilterChange(updatedFilters)

      setTimeout(() => {
        setActiveInput({ type: onlyOperator ? 'value' : 'operator', path: newPath })
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

      handlePropertySelection(selectedProperty, currentPath, group)
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

      if (item.isFreeformSearch && item.freeformPropertyName) {
        if (!activeInput || activeInput.type !== 'group') return
        const property = filterProperties.find((p) => p.name === item.freeformPropertyName)
        if (!property) return

        const currentPath = activeInput.path
        const group = findGroupByPath(activeFilters, currentPath)
        if (!group) return

        const operators = property.operators ?? ['=']
        const defaultOperator =
          operators.find((op) => (isFilterOperatorObject(op) ? op.value : op) === '=') ??
          operators[0]
        const operatorValue = isFilterOperatorObject(defaultOperator)
          ? defaultOperator.value
          : defaultOperator

        let updatedFilters = addFilterToGroup(activeFilters, currentPath, property)
        const newPath = [...currentPath, group.conditions.length]
        updatedFilters = updateNestedOperator(updatedFilters, newPath, operatorValue)
        updatedFilters = updateNestedValue(updatedFilters, newPath, item.freeformValue ?? '')
        commitFilters(updatedFilters)
        onFreeformTextChange('')
        setTimeout(() => {
          setActiveInput({ type: 'group', path: currentPath })
        }, 0)
        return
      }

      if (item.value === 'group') {
        handleGroupCommand()
        return
      }

      if (activeInput?.type === 'value') {
        handleValueCommand(item)
      } else if (activeInput?.type === 'operator') {
        if (item.isDefaultOperator) {
          const path = activeInput.path
          const filtersWithOperator = updateNestedOperator(activeFilters, path, item.value)
          commitFilters(updateNestedValue(filtersWithOperator, path, item.defaultValue ?? ''))

          // Added minor delay to ensure the filter is updated before navigating to the group
          setTimeout(() => {
            setActiveInput({ type: 'group', path: path.slice(0, -1) })
          }, 0)
        } else {
          handleOperatorCommand(selectedValue)
        }
      } else if (activeInput?.type === 'group') {
        handleGroupPropertyCommand(selectedValue)
      }
    },
    [
      activeInput,
      activeFilters,
      freeformText,
      filterProperties,
      onFreeformTextChange,
      setActiveInput,
      handleGroupCommand,
      handleValueCommand,
      handleOperatorCommand,
      handleGroupPropertyCommand,
      commitFilters,
      setIsCommandMenuVisible,
    ]
  )

  return {
    handleItemSelect,
  }
}
