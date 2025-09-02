import { useMemo } from 'react'
import { parseAsString, useQueryState } from 'nuqs'
import type { FilterGroup } from 'ui-patterns/FilterBar'

const defaultFilters: FilterGroup = {
  logicalOperator: 'AND',
  conditions: [],
}

export function useEdgeFunctionFilters() {
  const [filtersParam, setFiltersParam] = useQueryState('filters', parseAsString.withDefault(''))

  const [freeformText, setFreeformText] = useQueryState('search', parseAsString.withDefault(''))

  const filters = useMemo(() => {
    if (!filtersParam) return defaultFilters

    try {
      return JSON.parse(filtersParam) as FilterGroup
    } catch {
      return defaultFilters
    }
  }, [filtersParam])

  const setFilters = (newFilters: FilterGroup) => {
    if (newFilters.conditions.length === 0) {
      setFiltersParam('')
    } else {
      setFiltersParam(JSON.stringify(newFilters))
    }
  }

  return {
    filters,
    setFilters,
    freeformText,
    setFreeformText,
  }
}
