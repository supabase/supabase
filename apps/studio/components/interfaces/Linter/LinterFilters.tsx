import { useParams } from 'common'
import { LINTER_LEVELS, LINT_TABS } from 'components/interfaces/Linter/Linter.constants'
import { DownloadResultsButton } from 'components/ui/DownloadResultsButton'
import { FilterPopover } from 'components/ui/FilterPopover'
import { Lint } from 'data/lint/lint-query'
import { RefreshCw } from 'lucide-react'
import { Button } from 'ui'

interface LinterFiltersProps {
  filterOptions: {
    name: string
    value: string
  }[]
  activeLints: Lint[]
  filteredLints: Lint[]
  currentTab: LINTER_LEVELS
  filters: { level: LINTER_LEVELS; filters: string[] }[]
  isLoading: boolean
  setFilters: (value: { level: LINTER_LEVELS; filters: string[] }[]) => void
  onClickRefresh: () => void
}

const LinterFilters = ({
  filterOptions,
  activeLints,
  filteredLints,
  currentTab,
  filters,
  isLoading,
  setFilters,
  onClickRefresh,
}: LinterFiltersProps) => {
  const { ref } = useParams()

  const updateFilters = (level: LINTER_LEVELS, newFilters: string[]) => {
    const updatedFilters = [...filters]

    const index = updatedFilters.findIndex((filter) => filter.level === level)
    if (index !== -1) {
      updatedFilters[index] = { ...updatedFilters[index], filters: newFilters }
      setFilters(updatedFilters)
    }
  }

  return (
    <div className="px-6 py-2 -mt-px flex bg-surface-200 items-center justify-between border-t">
      {LINT_TABS.map((tab) => (
        <div key={tab.id} className={tab.id === currentTab ? '' : 'hidden'}>
          <FilterPopover
            name="Filter"
            className="w-52"
            options={filterOptions}
            disabled={activeLints.filter((x) => x.level === tab.id).length === 0}
            labelKey="name"
            valueKey="value"
            activeOptions={filters.find((filter) => filter.level === tab.id)?.filters || []}
            onSaveFilters={(values) => updateFilters(tab.id, values)}
          />
        </div>
      ))}
      <div className="flex items-center gap-x-2">
        <Button
          size="tiny"
          type="default"
          disabled={isLoading}
          onClick={onClickRefresh}
          icon={
            <RefreshCw className={`text-foreground-light ${isLoading ? 'animate-spin' : ''}`} />
          }
        >
          Refresh
        </Button>
        <DownloadResultsButton
          align="end"
          results={filteredLints}
          fileName={`Supabase Performance Security Lints (${ref})`}
        />
      </div>
    </div>
  )
}

export default LinterFilters
