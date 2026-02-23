import { KeyboardEvent, useCallback } from 'react'

import {
  ConditionPath,
  HighlightNavigationResult,
  KeyboardNavigationConfig,
  NavigationDirection,
} from './types'
import { findConditionByPath, findGroupByPath, removeFromGroup } from './utils'

export function useKeyboardNavigation({
  activeInput,
  setActiveInput,
  activeFilters,
  onFilterChange,
  highlightedConditionPath,
  setHighlightedConditionPath,
}: KeyboardNavigationConfig) {
  const removeByPath = useCallback(
    (path: ConditionPath) => {
      const updatedFilters = removeFromGroup(activeFilters, path)
      onFilterChange(updatedFilters)
    },
    [activeFilters, onFilterChange]
  )

  const findFirstConditionInGroup = useCallback(
    (groupPath: ConditionPath): ConditionPath | null => {
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
    (groupPath: ConditionPath): ConditionPath | null => {
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
    (currentPath: ConditionPath): ConditionPath | null => {
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

  const getHighlightNavigationPath = useCallback(
    (direction: NavigationDirection): HighlightNavigationResult => {
      if (activeInput?.type !== 'group') return null

      const group = findGroupByPath(activeFilters, activeInput.path)
      if (!group || group.conditions.length === 0) return null

      if (highlightedConditionPath) {
        const currentIndex = highlightedConditionPath[highlightedConditionPath.length - 1]

        if (direction === 'prev') {
          if (currentIndex > 0) {
            return [...activeInput.path, currentIndex - 1]
          }
          return 'clear'
        } else {
          if (currentIndex < group.conditions.length - 1) {
            return [...activeInput.path, currentIndex + 1]
          }
          return 'clear'
        }
      } else {
        if (direction === 'prev') {
          return [...activeInput.path, group.conditions.length - 1]
        }
        // 'next' with no highlight does nothing - user is already at the rightmost position
        return null
      }
    },
    [activeInput, activeFilters, highlightedConditionPath]
  )

  const applyHighlightNavigation = useCallback(
    (result: HighlightNavigationResult) => {
      if (result === 'clear') {
        setHighlightedConditionPath(null)
      } else if (result) {
        setHighlightedConditionPath(result)
      }
    },
    [setHighlightedConditionPath]
  )

  const handleBackspace = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (activeInput?.type === 'operator') return

      const inputElement = e.target as HTMLInputElement
      const isEmpty = inputElement.value === ''

      if (activeInput?.type === 'group' && isEmpty) {
        e.preventDefault()

        if (highlightedConditionPath) {
          removeByPath(highlightedConditionPath)
          setHighlightedConditionPath(null)
        } else {
          const result = getHighlightNavigationPath('prev')
          applyHighlightNavigation(result)
        }
      } else if (activeInput?.type === 'group' && activeInput.path.length > 0) {
        // Edge case: remove nested empty groups, but not the root group
        const group = findGroupByPath(activeFilters, activeInput.path)
        if (group && group.conditions.length === 0) {
          e.preventDefault()
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
    [
      activeInput,
      activeFilters,
      removeByPath,
      setActiveInput,
      highlightedConditionPath,
      setHighlightedConditionPath,
      getHighlightNavigationPath,
      applyHighlightNavigation,
    ]
  )

  const handleArrowLeft = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const inputElement = e.target as HTMLInputElement
      const isEmpty = inputElement.value === ''

      if (activeInput?.type === 'group' && isEmpty) {
        e.preventDefault()
        const result = getHighlightNavigationPath('prev')
        applyHighlightNavigation(result)
        return
      }

      if (activeInput?.type === 'value' && inputElement.selectionStart === 0) {
        e.preventDefault()
        const prevPath = findPreviousCondition(activeInput.path)
        if (prevPath) {
          setActiveInput({ type: 'value', path: prevPath })
        }
      }
    },
    [
      activeInput,
      getHighlightNavigationPath,
      applyHighlightNavigation,
      findPreviousCondition,
      setActiveInput,
    ]
  )

  const handleArrowRight = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const inputElement = e.target as HTMLInputElement
      const isEmpty = inputElement.value === ''

      if (activeInput?.type === 'group' && isEmpty && highlightedConditionPath) {
        e.preventDefault()
        const result = getHighlightNavigationPath('next')
        applyHighlightNavigation(result)
        return
      }

      if (
        activeInput?.type === 'value' &&
        inputElement.selectionStart === inputElement.value.length
      ) {
        e.preventDefault()
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
      }
    },
    [
      activeInput,
      activeFilters,
      highlightedConditionPath,
      getHighlightNavigationPath,
      applyHighlightNavigation,
      findFirstConditionInGroup,
      setActiveInput,
    ]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        handleBackspace(e)
      } else if (e.key === 'ArrowLeft') {
        handleArrowLeft(e)
      } else if (e.key === 'ArrowRight') {
        handleArrowRight(e)
      } else if (e.key === 'Escape') {
        if (highlightedConditionPath) {
          e.preventDefault()
          setHighlightedConditionPath(null)
        } else {
          const activeElement = document.activeElement as HTMLElement | null
          if (activeElement && activeElement.blur) {
            activeElement.blur()
          }
        }
      } else if (e.key === 'Enter') {
        if (highlightedConditionPath) {
          e.preventDefault()
          setActiveInput({ type: 'value', path: highlightedConditionPath })
          setHighlightedConditionPath(null)
        } else if (activeInput?.type === 'value') {
          e.preventDefault()
          setActiveInput({ type: 'group', path: activeInput.path.slice(0, -1) })
        } else if (activeInput?.type === 'operator') {
          e.preventDefault()
          const conditionPath = activeInput.path
          setActiveInput({ type: 'value', path: conditionPath })
        }
      }
    },
    [
      activeInput,
      handleBackspace,
      handleArrowLeft,
      handleArrowRight,
      setActiveInput,
      highlightedConditionPath,
      setHighlightedConditionPath,
    ]
  )

  return {
    handleKeyDown,
  }
}
