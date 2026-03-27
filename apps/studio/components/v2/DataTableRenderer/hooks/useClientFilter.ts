import { useMemo } from 'react'
import type { FilterDefinition, FilterState } from '../types'

export function useClientFilter<T extends Record<string, any>>(
  rows: T[],
  filterState: FilterState,
  filters?: FilterDefinition[]
): T[] {
  return useMemo(() => {
    if (!filters || filters.length === 0) return rows

    const activeFilters = filters.filter((f) => {
      const val = filterState[f.id]
      if (val === undefined || val === '' || val === false) return false
      if (Array.isArray(val) && val.length === 0) return false
      return true
    })

    if (activeFilters.length === 0) return rows

    return rows.filter((row) => {
      return activeFilters.every((filter) => {
        const filterValue = filterState[filter.id]

        if (filter.type === 'search') {
          const search = (filterValue as string).toLowerCase()
          // Search across all string/number fields
          return Object.values(row).some((v) => {
            if (v === null || v === undefined) return false
            return String(v).toLowerCase().includes(search)
          })
        }

        if (filter.type === 'select') {
          const rowVal = row[filter.id]
          return String(rowVal) === String(filterValue)
        }

        if (filter.type === 'multi-select') {
          const selected = filterValue as string[]
          const rowVal = String(row[filter.id])
          return selected.includes(rowVal)
        }

        if (filter.type === 'toggle') {
          return Boolean(row[filter.id]) === Boolean(filterValue)
        }

        return true
      })
    })
  }, [rows, filterState, filters])
}
