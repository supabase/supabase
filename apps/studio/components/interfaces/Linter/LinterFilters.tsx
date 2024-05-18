import { LINTER_LEVELS, LINT_TABS } from 'components/interfaces/Linter/Linter.constants'
import { FilterPopover } from 'components/ui/FilterPopover'
import { Lint } from 'data/lint/lint-query'

interface LinterFiltersProps {
  filterOptions: {
    name: string
    value: string
  }[]
  activeLints: Lint[]
  currentTab: LINTER_LEVELS
  filters: { level: LINTER_LEVELS; filters: string[] }[]
  setFilters: (value: { level: LINTER_LEVELS; filters: string[] }[]) => void
}

const LinterFilters = ({
  filterOptions,
  activeLints,
  currentTab,
  filters,
  setFilters,
}: LinterFiltersProps) => {
  const updateFilters = (level: LINTER_LEVELS, newFilters: string[]) => {
    const updatedFilters = [...filters]

    const index = updatedFilters.findIndex((filter) => filter.level === level)
    if (index !== -1) {
      updatedFilters[index] = { ...updatedFilters[index], filters: newFilters }
      setFilters(updatedFilters)
    }
  }

  return (
    <div className="bg-surface-200 p-2 px-6 py-2 border-t -mt-px">
      {LINT_TABS.map((tab) => (
        <div key={tab.id} className={tab.id === currentTab ? '' : 'hidden'}>
          <FilterPopover
            name="Filter"
            options={filterOptions}
            disabled={activeLints.filter((x) => x.level === tab.id).length === 0}
            labelKey="name"
            valueKey="value"
            activeOptions={filters.find((filter) => filter.level === tab.id)?.filters || []}
            onSaveFilters={(values) => updateFilters(tab.id, values)}
          />
        </div>
      ))}
    </div>
  )
}

export default LinterFilters
