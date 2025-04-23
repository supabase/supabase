import { useMemo, useState, useRef } from 'react'
import type { Filter, FilterOperator } from '@supabase/pg-meta/src/query'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  FilterBar,
  FilterGroup,
  FilterProperty,
  FilterCondition as UIFilterCondition,
} from 'ui-patterns/FilterBar'
import { useTableFilter } from '../../hooks/useTableFilter'
import { FilterOperatorOptions } from './filter/Filter.constants'

export const TableEditorFilters = () => {
  const { filters, onApplyFilters } = useTableFilter()
  const snap = useTableEditorTableStateSnapshot()
  const filterBarRef = useRef<HTMLDivElement>(null)

  // Convert hook filters to FilterGroup format
  const initialFilters: FilterGroup = useMemo(() => {
    return {
      logicalOperator: 'AND' as const,
      conditions: filters.map((filter) => ({
        propertyName: filter.column,
        operator: filter.operator,
        value: filter.value,
      })),
    }
  }, []) // Empty dependency array - only run once on initial render

  // Initialize with filters from the hook
  const [internalFilters, setInternalFilters] = useState<FilterGroup>(initialFilters)
  const [freeformText, setFreeformText] = useState('')

  const filterProperties = useMemo(() => {
    const properties: FilterProperty[] = []

    // Get column info directly from snap
    if (snap.table?.columns && Array.isArray(snap.table.columns)) {
      snap.table.columns.forEach((column: { name: string; format?: string }) => {
        if (column.name) {
          // Determine type based on column format
          let type: 'string' | 'number' | 'date' | 'boolean' = 'string'
          if (column.format?.includes('int') || column.format?.includes('numeric')) {
            type = 'number'
          } else if (column.format?.includes('time') || column.format?.includes('date')) {
            type = 'date'
          }

          properties.push({
            label: column.name,
            name: column.name,
            type,
            operators: FilterOperatorOptions.map((op) => op.value),
            options: [],
          })
        }
      })
    }

    return properties
  }, [snap.table?.columns])

  const handleFilterChange = (filterGroup: FilterGroup) => {
    // Update internal state
    setInternalFilters(filterGroup)

    // Convert to Filter[] format - extract only the valid conditions
    const newFilters: Filter[] = []

    filterGroup.conditions.forEach((condition) => {
      if (!('propertyName' in condition)) return
      if (!condition.propertyName) return

      newFilters.push({
        column: condition.propertyName,
        operator: condition.operator as FilterOperator,
        value: condition.value ?? '',
      })
    })

    // Apply the filters - let the hook handle duplicates
    onApplyFilters(newFilters)
  }

  return (
    <div className="flex-1" ref={filterBarRef}>
      <FilterBar
        filterProperties={filterProperties}
        filters={internalFilters}
        onFilterChange={handleFilterChange}
        freeformText={freeformText}
        onFreeformTextChange={setFreeformText}
      />
    </div>
  )
}
