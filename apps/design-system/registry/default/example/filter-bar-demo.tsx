import { useState } from 'react'
import { FilterBar, FilterGroup } from 'ui-patterns'

const filterProperties = [
  {
    label: 'Name',
    name: 'name',
    type: 'string' as const,
    operators: ['=', '!=', 'CONTAINS', 'STARTS WITH', 'ENDS WITH'],
  },
  {
    label: 'Status',
    name: 'status',
    type: 'string' as const,
    options: ['active', 'inactive', 'pending'],
    operators: ['=', '!='],
  },
  {
    label: 'Type',
    name: 'type',
    type: 'string' as const,
    options: async (search?: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const allOptions = ['user', 'admin', 'guest']
      return search
        ? allOptions.filter((option) => option.toLowerCase().includes(search.toLowerCase()))
        : allOptions
    },
    operators: ['=', '!='],
  },
]

const initialFilters: FilterGroup = {
  logicalOperator: 'AND',
  conditions: [
    {
      propertyName: 'name',
      value: '',
      operator: '=',
    },
    {
      propertyName: 'status',
      value: '',
      operator: '=',
    },
  ],
}

export default function FilterBarDemo() {
  const [filters, setFilters] = useState<FilterGroup>(initialFilters)
  const [freeformText, setFreeformText] = useState('')

  return (
    <div className="w-full">
      <FilterBar
        filterProperties={filterProperties}
        freeformText={freeformText}
        onFreeformTextChange={setFreeformText}
        filters={filters}
        onFilterChange={setFilters}
      />
    </div>
  )
}
