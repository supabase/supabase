import React, { KeyboardEvent, useCallback } from 'react'
import { ActiveInput } from './hooks'
import { FilterGroup } from './types'
import { findGroupByPath, findConditionByPath, removeFromGroup } from './utils'

export function useKeyboardNavigation({
  activeInput,
  setActiveInput,
  activeFilters,
  onFilterChange,
}: {
  activeInput: ActiveInput
  setActiveInput: (input: ActiveInput) => void
  activeFilters: FilterGroup
  onFilterChange: (filters: FilterGroup) => void
}) {
  const removeFilterByPath = useCallback(
    (path: number[]) => {
      const updatedFilters = removeFromGroup(activeFilters, path)
      onFilterChange(updatedFilters)
    },
    [activeFilters, onFilterChange]
  )

  const removeGroupByPath = useCallback(
    (path: number[]) => {
      const updatedFilters = removeFromGroup(activeFilters, path)
      onFilterChange(updatedFilters)
    },
    [activeFilters, onFilterChange]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        handleBackspace(e)
      } else if (e.key === ' ' && activeInput?.type === 'value') {
        e.preventDefault()
        setActiveInput({ type: 'group', path: [] })
      } else if (e.key === 'ArrowLeft') {
        handleArrowLeft(e)
      } else if (e.key === 'ArrowRight') {
        handleArrowRight(e)
      } else if (e.key === 'Escape') {
        setActiveInput(null)
      }
    },
    [activeInput, activeFilters]
  )

  const handleBackspace = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (activeInput?.type === 'operator') return

      const inputElement = e.target as HTMLInputElement
      const isEmpty = inputElement.value === ''

      if (activeInput?.type === 'group' && isEmpty) {
        e.preventDefault()
        const group = findGroupByPath(activeFilters, activeInput.path)

        if (group && group.conditions.length > 0) {
          const lastConditionPath = [...activeInput.path, group.conditions.length - 1]
          removeFilterByPath(lastConditionPath)
          setActiveInput({ type: 'group', path: activeInput.path })
        } else if (group && group.conditions.length === 0) {
          removeGroupByPath(activeInput.path)

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
          setActiveInput({
            type: 'group',
            path: activeInput.path.slice(0, -1),
          })
        }
      }
    },
    [activeInput, activeFilters, removeFilterByPath, removeGroupByPath, setActiveInput]
  )

  const findPreviousCondition = useCallback(
    (currentPath: number[]): number[] | null => {
      const [groupPath, conditionIndex] = [
        currentPath.slice(0, -1),
        currentPath[currentPath.length - 1],
      ]

      // Try previous condition in same group
      if (conditionIndex > 0) {
        const prevPath = [...groupPath, conditionIndex - 1]
        const group = findGroupByPath(activeFilters, groupPath)
        const prevCondition = group?.conditions[conditionIndex - 1]
        // If previous is a condition (not a group), return its path
        if (prevCondition && !('logicalOperator' in prevCondition)) {
          return prevPath
        }
        // If previous is a group, find its last condition recursively
        if (prevCondition && 'logicalOperator' in prevCondition) {
          return findLastConditionInGroup(prevPath)
        }
      }

      // No previous condition in this group, go up to parent
      if (groupPath.length > 0) {
        return findPreviousCondition(groupPath)
      }

      return null
    },
    [activeFilters]
  )

  const findNextCondition = useCallback(
    (currentPath: number[]): number[] | null => {
      const [groupPath, conditionIndex] = [
        currentPath.slice(0, -1),
        currentPath[currentPath.length - 1],
      ]
      const group = findGroupByPath(activeFilters, groupPath)

      // Try next condition in same group
      if (group && conditionIndex < group.conditions.length - 1) {
        const nextPath = [...groupPath, conditionIndex + 1]
        const nextCondition = group.conditions[conditionIndex + 1]
        // If next is a condition, return its path
        if (!('logicalOperator' in nextCondition)) {
          return nextPath
        }
        // If next is a group, find its first condition recursively
        return findFirstConditionInGroup(nextPath)
      }

      // No next condition in this group, go up to parent and find next
      if (groupPath.length > 0) {
        return findNextCondition(groupPath)
      }

      return null
    },
    [activeFilters]
  )

  const findFirstConditionInGroup = useCallback(
    (groupPath: number[]): number[] | null => {
      const group = findGroupByPath(activeFilters, groupPath)
      if (!group || group.conditions.length === 0) return null

      const firstCondition = group.conditions[0]
      if (!('logicalOperator' in firstCondition)) {
        return [...groupPath, 0]
      }
      // First item is a group, recurse
      return findFirstConditionInGroup([...groupPath, 0])
    },
    [activeFilters]
  )

  const findLastConditionInGroup = useCallback(
    (groupPath: number[]): number[] | null => {
      const group = findGroupByPath(activeFilters, groupPath)
      if (!group || group.conditions.length === 0) return null

      const lastCondition = group.conditions[group.conditions.length - 1]
      const lastIndex = group.conditions.length - 1
      if (!('logicalOperator' in lastCondition)) {
        return [...groupPath, lastIndex]
      }
      // Last item is a group, recurse
      return findLastConditionInGroup([...groupPath, lastIndex])
    },
    [activeFilters]
  )

  const findPreviousConditionFromGroup = useCallback(
    (groupPath: number[]): number[] | null => {
      // If this group has conditions, find the last one
      const group = findGroupByPath(activeFilters, groupPath)
      if (group && group.conditions.length > 0) {
        return findLastConditionInGroup(groupPath)
      }

      // No conditions in this group, find previous sibling or parent
      if (groupPath.length > 0) {
        const parentPath = groupPath.slice(0, -1)
        const groupIndex = groupPath[groupPath.length - 1]
        if (groupIndex > 0) {
          // Find last condition in previous sibling
          const prevSiblingPath = [...parentPath, groupIndex - 1]
          const parentGroup = findGroupByPath(activeFilters, parentPath)
          const prevSibling = parentGroup?.conditions[groupIndex - 1]
          if (prevSibling) {
            if ('logicalOperator' in prevSibling) {
              return findLastConditionInGroup(prevSiblingPath)
            } else {
              return prevSiblingPath
            }
          }
        }
        // Look at parent group
        return findPreviousConditionFromGroup(parentPath)
      }

      return null
    },
    [activeFilters, findLastConditionInGroup]
  )

  const findNextConditionFromGroup = useCallback(
    (groupPath: number[]): number[] | null => {
      // Find next sibling or dive into nested groups
      if (groupPath.length > 0) {
        const parentPath = groupPath.slice(0, -1)
        const groupIndex = groupPath[groupPath.length - 1]
        const parentGroup = findGroupByPath(activeFilters, parentPath)

        if (parentGroup && groupIndex < parentGroup.conditions.length - 1) {
          // Find first condition in next sibling
          const nextSiblingPath = [...parentPath, groupIndex + 1]
          const nextSibling = parentGroup.conditions[groupIndex + 1]
          if ('logicalOperator' in nextSibling) {
            return findFirstConditionInGroup(nextSiblingPath)
          } else {
            return nextSiblingPath
          }
        }
        // Look at parent group
        return findNextConditionFromGroup(parentPath)
      }

      return null
    },
    [activeFilters, findFirstConditionInGroup]
  )

  const handleArrowLeft = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const inputElement = e.target as HTMLInputElement
      if (inputElement.selectionStart === 0) {
        e.preventDefault()
        if (activeInput?.type === 'value') {
          const prevPath = findPreviousCondition(activeInput.path)
          if (prevPath) {
            setActiveInput({ type: 'value', path: prevPath })
          }
        } else if (activeInput?.type === 'group') {
          // From freeform input, find the last condition in the previous group/condition
          const prevPath = findPreviousConditionFromGroup(activeInput.path)
          if (prevPath) {
            setActiveInput({ type: 'value', path: prevPath })
          }
        }
      }
    },
    [activeInput, findPreviousCondition, findPreviousConditionFromGroup, setActiveInput]
  )

  const handleArrowRight = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const inputElement = e.target as HTMLInputElement
      if (inputElement.selectionStart === inputElement.value.length) {
        e.preventDefault()
        if (activeInput?.type === 'value') {
          // Check if there's a next condition in the same group first
          const groupPath = activeInput.path.slice(0, -1)
          const conditionIndex = activeInput.path[activeInput.path.length - 1]
          const group = findGroupByPath(activeFilters, groupPath)

          if (group && conditionIndex < group.conditions.length - 1) {
            // There's a next condition, navigate to it
            const nextCondition = group.conditions[conditionIndex + 1]
            if ('logicalOperator' in nextCondition) {
              // Next is a group, find its first condition
              const nextPath = findFirstConditionInGroup([...groupPath, conditionIndex + 1])
              if (nextPath) {
                setActiveInput({ type: 'value', path: nextPath })
              }
            } else {
              // Next is a condition
              setActiveInput({ type: 'value', path: [...groupPath, conditionIndex + 1] })
            }
          } else {
            // No next condition in this group, move to group's freeform input
            setActiveInput({ type: 'group', path: groupPath })
          }
        } else if (activeInput?.type === 'group') {
          // From freeform input, find what's to the right of this group
          const nextPath = findNextConditionFromGroup(activeInput.path)
          if (nextPath) {
            setActiveInput({ type: 'value', path: nextPath })
          }
        }
      }
    },
    [
      activeInput,
      activeFilters,
      findGroupByPath,
      findFirstConditionInGroup,
      findNextConditionFromGroup,
      setActiveInput,
    ]
  )

  return {
    handleKeyDown,
  }
}
