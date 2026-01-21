import { parseAsArrayOf, parseAsJson, parseAsString, useQueryStates } from 'nuqs'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import {
  NumericFilter,
  ReportsNumericFilter,
} from 'components/interfaces/Reports/v2/ReportsNumericFilter'
import { FilterInput } from './components/FilterInput'
import { IndexAdvisorFilter } from './components/IndexAdvisorFilter'
import { RolesFilterDropdown } from './components/RolesFilterDropdown'
import { SortIndicator } from './components/SortIndicator'
import { useIndexAdvisorStatus } from './hooks/useIsIndexAdvisorStatus'
import { useQueryPerformanceSort } from './hooks/useQueryPerformanceSort'
import { useDebouncedValue } from 'hooks/misc/useDebouncedValue'

export const QueryPerformanceFilterBar = ({
  actions,
  showRolesFilter = false,
}: {
  actions?: ReactNode
  showRolesFilter?: boolean
}) => {
  const { sort, clearSort } = useQueryPerformanceSort()
  const { isIndexAdvisorEnabled } = useIndexAdvisorStatus()

  const [
    { search: searchQuery, roles: defaultFilterRoles, callsFilter, totalTimeFilter, indexAdvisor },
    setSearchParams,
  ] = useQueryStates({
    search: parseAsString.withDefault(''),
    roles: parseAsArrayOf(parseAsString).withDefault([]),
    callsFilter: parseAsJson((value) => value as NumericFilter | null).withDefault(null),
    totalTimeFilter: parseAsJson((value) => value as NumericFilter | null).withDefault(null),
    indexAdvisor: parseAsString.withDefault('false'),
  })

  const [filters, setFilters] = useState<{ roles: string[] }>({
    roles: defaultFilterRoles,
  })
  const [inputValue, setInputValue] = useState(searchQuery)

  const onSearchQueryChange = (value: string) => {
    setSearchParams({ search: value || '' })
  }

  const onFilterRolesChange = (roles: string[]) => {
    setFilters({ ...filters, roles })
    setSearchParams({ roles })
  }

  const debouncedInputValue = useDebouncedValue(inputValue, 300)

  const onIndexAdvisorToggle = () => {
    setSearchParams({ indexAdvisor: indexAdvisor === 'true' ? 'false' : 'true' })
  }

  useEffect(() => {
    onSearchQueryChange(debouncedInputValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInputValue])

  const hasActiveFilters = useMemo(() => {
    return (
      (searchQuery && searchQuery.length > 0) ||
      (defaultFilterRoles && defaultFilterRoles.length > 0) ||
      callsFilter !== null ||
      totalTimeFilter !== null ||
      indexAdvisor === 'true'
    )
  }, [searchQuery, defaultFilterRoles, callsFilter, totalTimeFilter, indexAdvisor])

  const handleClearAllFilters = () => {
    setSearchParams({
      search: '',
      roles: [],
      callsFilter: null,
      totalTimeFilter: null,
      indexAdvisor: 'false',
    })
    setInputValue('')
    setFilters({ roles: [] })
  }

  return (
    <div className="px-4 py-1.5 bg-surface-200 border-t -mt-px flex justify-between items-center overflow-x-auto overflow-y-hidden w-full flex-shrink-0">
      <div className="flex items-center gap-x-4">
        <div className="flex items-center gap-x-2">
          <FilterInput value={inputValue} onChange={setInputValue} />

          <ReportsNumericFilter
            label="Calls"
            value={callsFilter}
            onChange={(value) => setSearchParams({ callsFilter: value })}
            operators={['=', '>=', '<=', '>', '<', '!=']}
            defaultOperator=">="
            placeholder="e.g. 100"
            min={0}
            className="w-auto"
          />

          <ReportsNumericFilter
            label="Total Time"
            value={totalTimeFilter}
            onChange={(value) => setSearchParams({ totalTimeFilter: value })}
            operators={['=', '>=', '<=', '>', '<', '!=']}
            defaultOperator=">"
            placeholder="e.g. 1000"
            min={0}
            className="w-auto"
          />

          {showRolesFilter && (
            <RolesFilterDropdown
              activeOptions={filters.roles}
              onSaveFilters={onFilterRolesChange}
            />
          )}

          {isIndexAdvisorEnabled && (
            <IndexAdvisorFilter
              isActive={indexAdvisor === 'true'}
              onToggle={onIndexAdvisorToggle}
            />
          )}

          {sort && <SortIndicator sort={sort} onClearSort={clearSort} />}

          {hasActiveFilters && (
            <ButtonTooltip
              type="text"
              size="tiny"
              icon={<X />}
              onClick={handleClearAllFilters}
              className="px-1"
              tooltip={{
                content: {
                  side: 'top',
                  text: 'Clear all filters',
                },
              }}
            />
          )}
        </div>
      </div>
      <div className="flex gap-2 items-center pl-2">{actions}</div>
    </div>
  )
}
