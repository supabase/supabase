import { groupBy } from 'lodash'
import { useState } from 'react'
import { FilterBar, FilterCondition, type FilterGroup, type FilterProperty } from 'ui-patterns'

import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'

export const LogsFilterBar = () => {
  const { table, filterFields } = useDataTable()

  const [freeformText, setFreeformText] = useState('')
  const [filters, setFilters] = useState<FilterGroup>({
    logicalOperator: 'AND',
    conditions: [],
  })

  const filterProperties: FilterProperty[] = filterFields
    .filter((x) => x.type !== 'timerange')
    .map((filter) => ({
      label: filter.label,
      name: filter.value,
      type: 'string',
      options: filter.options ?? [],
      operators: ['='],
    }))

  const onApplyFilters = (filters: FilterGroup) => {
    setFilters(filters)

    // [Joshen] Actual server side filter applying
    // I'm wondering whether this logic should be within the FilterBar component tbh
    // There's no nested conditions either for unified logs, hence the type cast
    const isValid = filters.conditions.every(
      (x) =>
        !!(x as FilterCondition).operator &&
        !!(x as FilterCondition).value &&
        !!(x as FilterCondition).propertyName
    )

    if (isValid) {
      const filterConditions = filters.conditions as FilterCondition[]
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
  }

  return (
    <FilterBar
      variant="pill"
      className="[&>div>div>div>input]:!text-xs"
      filterProperties={filterProperties}
      freeformText={freeformText}
      filters={filters}
      onFilterChange={onApplyFilters}
      onFreeformTextChange={setFreeformText}
    />
  )
}
