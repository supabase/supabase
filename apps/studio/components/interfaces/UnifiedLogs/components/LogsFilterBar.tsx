import { groupBy } from 'lodash'
import { useState } from 'react'
import { FilterBar, FilterCondition, type FilterGroup, type FilterProperty } from 'ui-patterns'

import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'

export const LogsFilterBar = () => {
  const { table, filterFields } = useDataTable()

  const [freeformText, setFreeformText] = useState('')

  const filterProperties: FilterProperty[] = filterFields
    .filter((x) => x.type !== 'timerange')
    .map((filter) => ({
      label: filter.label,
      name: filter.value,
      type: 'string',
      options: filter.options ?? [],
      operators: ['='],
    }))

  // Seed from the table's columnFilters (already hydrated from the URL by the parent) so
  // chips re-appear after a page reload or a deep-link.
  const [filters, setFilters] = useState<FilterGroup>(() => {
    const filterableNames = new Set(filterProperties.map((p) => p.name))
    const conditions: FilterCondition[] = []
    for (const { id, value } of table.getState().columnFilters) {
      if (!filterableNames.has(id) || value === null || value === undefined) continue
      const values = Array.isArray(value) ? value : [value]
      for (const v of values) {
        conditions.push({
          propertyName: id,
          value: v as FilterCondition['value'],
          operator: '=',
        })
      }
    }
    return { logicalOperator: 'AND', conditions }
  })

  // No nested conditions in unified logs — type-cast to FilterCondition on read.
  const onApply = (next: FilterGroup) => {
    const isValid = next.conditions.every(
      (x) =>
        !!(x as FilterCondition).operator &&
        !!(x as FilterCondition).value &&
        !!(x as FilterCondition).propertyName
    )
    if (!isValid) return

    const filterConditions = next.conditions as FilterCondition[]
    const groupedFilterConditions = groupBy(filterConditions, 'propertyName')
    Object.entries(groupedFilterConditions).forEach(([name, conditions]) => {
      table.getColumn(name)?.setFilterValue(conditions.map((x) => x.value))
    })

    const currentFilters = table.getState().columnFilters
    const filterColumns = Object.keys(groupedFilterConditions)
    const filtersToRemove = currentFilters.filter((x) => !filterColumns.includes(x.id))
    filtersToRemove.forEach((x) => {
      table.getColumn(x.id)?.setFilterValue(undefined)
    })
  }

  return (
    <FilterBar
      variant="pill"
      className="[&>div>div>div>input]:!text-xs"
      filterProperties={filterProperties}
      freeformText={freeformText}
      filters={filters}
      onFilterChange={setFilters}
      onApply={onApply}
      onFreeformTextChange={setFreeformText}
    />
  )
}
