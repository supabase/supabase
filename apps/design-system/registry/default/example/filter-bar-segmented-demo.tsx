import { useState } from 'react'
import { FilterBar, type FilterGroup } from 'ui-patterns/FilterBar'

const filterProperties = [
  { label: 'Name', name: 'name', type: 'string' as const, operators: ['=', '!='] },
  {
    label: 'Status',
    name: 'status',
    type: 'string' as const,
    options: ['active', 'inactive', 'pending'],
    operators: ['=', '!='],
  },
]

export default function FilterBarSegmentedDemo() {
  const [filters, setFilters] = useState<FilterGroup>({ logicalOperator: 'AND', conditions: [] })
  const [freeformText, setFreeformText] = useState('')

  return (
    <div className="w-full">
      <FilterBar
        filterProperties={filterProperties}
        filters={filters}
        onFilterChange={setFilters}
        freeformText={freeformText}
        onFreeformTextChange={setFreeformText}
      />
    </div>
  )
}
