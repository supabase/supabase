import { KeyboardEvent, useCallback } from 'react'

import { ActiveInput } from './hooks'
import { FilterGroup } from './types'
import { findConditionByPath, findGroupByPath, removeFromGroup } from './utils'

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
  const removeByPath = useCallback(
    (path: number[]) => {
      const updatedFilters = removeFromGroup(activeFilters, path)
      onFilterChange(updatedFilters)
    },
    [activeFilters, onFilterChange]
  )

  const findFirstConditionInGroup = useCallback(
    (groupPath: number[]): number[] | null => {
      const group = findGroupByPath(activeFilters, groupPath)
      if (!group || group.conditions.length === 0) return null

      const firstCondition = group.conditions[0]
      if (!('logicalOperator' in firstCondition)) {
        return [...groupPath, 0]
      }
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
      return findLastConditionInGroup([...groupPath, lastIndex])
    },
    [activeFilters]
  )

  const findPreviousCondition = useCallback(
    (currentPath: number[]): number[] | null => {
      const groupPath = currentPath.slice(0, -1)
      const conditionIndex = currentPath[currentPath.length - 1]

      if (conditionIndex > 0) {
        const prevPath = [...groupPath, conditionIndex - 1]
        const group = findGroupByPath(activeFilters, groupPath)
        const prevCondition = group?.conditions[conditionIndex - 1]
        if (prevCondition && !('logicalOperator' in prevCondition)) {
          return prevPath
        }
        if (prevCondition && 'logicalOperator' in prevCondition) {
          return findLastConditionInGroup(prevPath)
        }
      }

      if (groupPath.length > 0) {
        return findPreviousCondition(groupPath)
      }

      return null
    },
    [activeFilters, findLastConditionInGroup]
  )

  const findNextCondition = useCallback(
    (currentPath: number[]): number[] | null => {
      const groupPath = currentPath.slice(0, -1)
      const conditionIndex = currentPath[currentPath.length - 1]
      const group = findGroupByPath(activeFilters, groupPath)

      if (group && conditionIndex < group.conditions.length - 1) {
        const nextPath = [...groupPath, conditionIndex + 1]
        const nextCondition = group.conditions[conditionIndex + 1]
        if (!('logicalOperator' in nextCondition)) {
          return nextPath
        }
        return findFirstConditionInGroup(nextPath)
      }

      if (groupPath.length > 0) {
        return findNextCondition(groupPath)
      }

      return null
    },
    [activeFilters, findFirstConditionInGroup]
  )

  const findPreviousConditionFromGroup = useCallback(
    (groupPath: number[]): number[] | null => {
      const group = findGroupByPath(activeFilters, groupPath)
      if (group && group.conditions.length > 0) {
        return findLastConditionInGroup(groupPath)
      }

      if (groupPath.length > 0) {
        const parentPath = groupPath.slice(0, -1)
        const groupIndex = groupPath[groupPath.length - 1]
        if (groupIndex > 0) {
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
        return findPreviousConditionFromGroup(parentPath)
      }

      return null
    },
    [activeFilters, findLastConditionInGroup]
  )

  const findNextConditionFromGroup = useCallback(
    (groupPath: number[]): number[] | null => {
      if (groupPath.length > 0) {
        const parentPath = groupPath.slice(0, -1)
        const groupIndex = groupPath[groupPath.length - 1]
        const parentGroup = findGroupByPath(activeFilters, parentPath)

        if (parentGroup && groupIndex < parentGroup.conditions.length - 1) {
          const nextSiblingPath = [...parentPath, groupIndex + 1]
          const nextSibling = parentGroup.conditions[groupIndex + 1]
          if ('logicalOperator' in nextSibling) {
            return findFirstConditionInGroup(nextSiblingPath)
          } else {
            return nextSiblingPath
          }
        }
        return findNextConditionFromGroup(parentPath)
      }

      return null
    },
    [activeFilters, findFirstConditionInGroup]
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
          removeByPath(lastConditionPath)
          setActiveInput({ type: 'group', path: activeInput.path })
        } else if (group && group.conditions.length === 0 && activeInput.path.length > 0) {
          // Only remove nested empty groups, not the root group
          removeByPath(activeInput.path)
          setActiveInput({
            type: 'group',
            path: activeInput.path.slice(0, -1),
          })
        }
      } else if (activeInput?.type === 'value' && isEmpty) {
        const condition = findConditionByPath(activeFilters, activeInput.path)
        if (condition && !condition.value) {
          e.preventDefault()
          setActiveInput({ type: 'operator', path: activeInput.path })
        }
      }
    },
    [activeInput, activeFilters, removeByPath, setActiveInput]
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
          const groupPath = activeInput.path.slice(0, -1)
          const conditionIndex = activeInput.path[activeInput.path.length - 1]
          const group = findGroupByPath(activeFilters, groupPath)

          if (group && conditionIndex < group.conditions.length - 1) {
            const nextCondition = group.conditions[conditionIndex + 1]
            if ('logicalOperator' in nextCondition) {
              const nextPath = findFirstConditionInGroup([...groupPath, conditionIndex + 1])
              if (nextPath) {
                setActiveInput({ type: 'value', path: nextPath })
              }
            } else {
              setActiveInput({ type: 'value', path: [...groupPath, conditionIndex + 1] })
            }
          } else {
            setActiveInput({ type: 'group', path: groupPath })
          }
        } else if (activeInput?.type === 'group') {
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
      findFirstConditionInGroup,
      findNextConditionFromGroup,
      setActiveInput,
    ]
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
        const activeElement = document.activeElement as HTMLElement | null
        if (activeElement && activeElement.blur) {
          activeElement.blur()
        }
      } else if (e.key === 'Enter') {
        if (activeInput?.type === 'value') {
          e.preventDefault()
          setActiveInput({ type: 'group', path: activeInput.path.slice(0, -1) })
        } else if (activeInput?.type === 'operator') {
          e.preventDefault()
          const conditionPath = activeInput.path
          setActiveInput({ type: 'value', path: conditionPath })
        }
      }
    },
    [activeInput, handleBackspace, handleArrowLeft, handleArrowRight, setActiveInput]
  )

  return {
    handleKeyDown,
  }
}
