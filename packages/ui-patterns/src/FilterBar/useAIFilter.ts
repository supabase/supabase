import { useCallback } from 'react'

import { ActiveInput } from './hooks'
import { FilterGroup, FilterProperty, isGroup } from './types'
import { updateGroupAtPath } from './utils'

export function useAIFilter({
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
}: {
  activeInput: ActiveInput
  aiApiUrl?: string
  freeformText: string
  filterProperties: FilterProperty[]
  activeFilters: FilterGroup
  onFilterChange: (filters: FilterGroup) => void
  onFreeformTextChange: (text: string) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setIsCommandMenuVisible: (visible: boolean) => void
}) {
  const handleAIFilter = useCallback(async () => {
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
      if (!data || !Array.isArray(data.conditions)) {
        throw new Error('Invalid response from AI filter')
      }

      const processedGroup = {
        logicalOperator: data.logicalOperator || 'AND',
        conditions: processConditions(data.conditions, filterProperties),
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
  }, [
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
  ])

  return { handleAIFilter }
}

function processConditions(conditions: any[], filterProperties: FilterProperty[]): any[] {
  return conditions.map((condition) => {
    if (isGroup(condition)) {
      return {
        logicalOperator: condition.logicalOperator,
        conditions: processConditions(condition.conditions, filterProperties),
      }
    } else {
      const matchedProperty = filterProperties.find((prop) => prop.name === condition.propertyName)
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
