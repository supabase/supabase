import { groupBy } from 'lodash'
import { useEffect, useState } from 'react'
import { FilterBar, FilterCondition, type FilterGroup, type FilterProperty } from 'ui-patterns'

import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'

const buildFilterGroup = (
  columnFilters: { id: string; value: unknown }[],
  filterableNames: Set<string>
): FilterGroup => {
  const conditions: FilterCondition[] = []
  for (const { id, value } of columnFilters) {
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
}

export const LogsFilterBar = () => {
  const { table, filterFields, columnFilters } = useDataTable()

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

  // Local state because the FilterBar carries transient states
  const [filters, setFilters] = useState<FilterGroup>(() =>
    buildFilterGroup(columnFilters, new Set(filterProperties.map((p) => p.name)))
  )

  // Read latest filterProperties without making the effect depend on its (per-render) identity.
  const syncFromColumnFilters = useStaticEffectEvent(() => {
    setFilters(buildFilterGroup(columnFilters, new Set(filterProperties.map((p) => p.name))))
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

  useEffect(() => {
    syncFromColumnFilters()
  }, [columnFilters, syncFromColumnFilters])

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
