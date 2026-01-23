import { parseAsArrayOf, parseAsJson, parseAsString, useQueryStates } from 'nuqs'
import { ReactNode, useEffect, useState } from 'react'
import {
  NumericFilter,
  ReportsNumericFilter,
} from 'components/interfaces/Reports/v2/ReportsNumericFilter'
import { FilterInput } from './components/FilterInput'
import { FilterPill } from './components/FilterPill'
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
    {
      search: searchQuery,
      roles: defaultFilterRoles,
      callsFilter: callsFilterRaw,
      totalTimeFilter: totalTimeFilterRaw,
      indexAdvisor,
    },
    setSearchParams,
  ] = useQueryStates({
    search: parseAsString.withDefault(''),
    roles: parseAsArrayOf(parseAsString).withDefault([]),
    callsFilter: parseAsJson<NumericFilter | null>((value) =>
      value === null || value === undefined ? null : (value as NumericFilter)
    ),
    totalTimeFilter: parseAsJson<NumericFilter | null>((value) =>
      value === null || value === undefined ? null : (value as NumericFilter)
    ),
    indexAdvisor: parseAsString.withDefault('false'),
  })

  const callsFilter = callsFilterRaw ?? null
  const totalTimeFilter = totalTimeFilterRaw ?? null

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

  const getCallsFilterDisplay = () => {
    if (!callsFilter) return null
    return `${callsFilter.operator} ${callsFilter.value}`
  }

  const getTotalTimeFilterDisplay = () => {
    if (!totalTimeFilter) return null
    return `${totalTimeFilter.operator} ${totalTimeFilter.value}`
  }

  return (
    <div className="px-4 py-1.5 bg-surface-200 border-t -mt-px flex justify-between items-center overflow-x-auto overflow-y-hidden w-full flex-shrink-0">
      <div className="flex items-center gap-x-4">
        <div className="flex items-center gap-x-2">
          <FilterInput value={inputValue} onChange={setInputValue} />

          {callsFilter ? (
            <FilterPill
              label="Calls"
              value={getCallsFilterDisplay() || ''}
              onClear={(e) => {
                e.stopPropagation()
                setSearchParams({ callsFilter: null })
              }}
            />
          ) : (
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
          )}

          {totalTimeFilter ? (
            <FilterPill
              label="Total Time"
              value={getTotalTimeFilterDisplay() || ''}
              onClear={(e) => {
                e.stopPropagation()
                setSearchParams({ totalTimeFilter: null })
              }}
            />
          ) : (
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
          )}

          {showRolesFilter &&
            (filters.roles && filters.roles.length > 0 ? (
              <FilterPill
                label="Roles"
                value={filters.roles.join(', ')}
                onClear={(e) => {
                  e.stopPropagation()
                  setFilters({ roles: [] })
                  setSearchParams({ roles: [] })
                }}
              />
            ) : (
              <RolesFilterDropdown
                activeOptions={filters.roles}
                onSaveFilters={onFilterRolesChange}
              />
            ))}

          {isIndexAdvisorEnabled && (
            <IndexAdvisorFilter
              isActive={indexAdvisor === 'true'}
              onToggle={onIndexAdvisorToggle}
            />
          )}

          {sort && <SortIndicator sort={sort} onClearSort={clearSort} />}
        </div>
      </div>
      <div className="flex gap-2 items-center pl-2">{actions}</div>
    </div>
  )
}
