import { useDebounce } from '@uidotdev/usehooks'
import { Lightbulb, Search, X } from 'lucide-react'
import { parseAsArrayOf, parseAsJson, parseAsString, useQueryStates } from 'nuqs'
import { ChangeEvent, ReactNode, useEffect, useState } from 'react'

import {
  NumericFilter,
  ReportsNumericFilter,
} from 'components/interfaces/Reports/v2/ReportsNumericFilter'
import { FilterPopover } from 'components/ui/FilterPopover'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, Tooltip, TooltipContent, TooltipTrigger, cn } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { useIndexAdvisorStatus } from './hooks/useIsIndexAdvisorStatus'
import { useQueryPerformanceSort } from './hooks/useQueryPerformanceSort'

export const QueryPerformanceFilterBar = ({
  actions,
  showRolesFilter = false,
}: {
  actions?: ReactNode
  showRolesFilter?: boolean
}) => {
  const { data: project } = useSelectedProjectQuery()
  const { sort, clearSort } = useQueryPerformanceSort()
  const { isIndexAdvisorEnabled } = useIndexAdvisorStatus()

  const [
    { search: searchQuery, roles: defaultFilterRoles, callsFilter, indexAdvisor },
    setSearchParams,
  ] = useQueryStates({
    search: parseAsString.withDefault(''),
    roles: parseAsArrayOf(parseAsString).withDefault([]),
    callsFilter: parseAsJson((value) => value as NumericFilter | null).withDefault({
      operator: '>=',
      value: 0,
    } as NumericFilter),
    indexAdvisor: parseAsString.withDefault('false'),
  })
  const { data, isPending: isLoadingRoles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const roles = (data ?? []).sort((a, b) => a.name.localeCompare(b.name))

  const [filters, setFilters] = useState<{ roles: string[] }>({
    roles: defaultFilterRoles,
  })
  const [inputValue, setInputValue] = useState(searchQuery)
  const debouncedInputValue = useDebounce(inputValue, 500)
  // const debouncedMinCalls = useDebounce(minCallsInput, 300)
  const searchValue = inputValue.length === 0 ? inputValue : debouncedInputValue

  const onSearchQueryChange = (value: string) => {
    setSearchParams({ search: value || '' })
  }

  const onFilterRolesChange = (roles: string[]) => {
    setFilters({ ...filters, roles })
    setSearchParams({ roles })
  }

  const onIndexAdvisorChange = (options: string[]) => {
    setSearchParams({ indexAdvisor: options.includes('true') ? 'true' : 'false' })
  }

  const onIndexAdvisorToggle = () => {
    setSearchParams({ indexAdvisor: indexAdvisor === 'true' ? 'false' : 'true' })
  }

  useEffect(() => {
    onSearchQueryChange(searchValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  const indexAdvisorOptions = [{ value: 'true', label: 'Index Advisor' }]

  return (
    <div className="px-4 py-1.5 bg-surface-200 border-t -mt-px flex justify-between items-center overflow-x-auto overflow-y-hidden w-full flex-shrink-0">
      <div className="flex items-center gap-x-4">
        <div className="flex items-center gap-x-2">
          <Input
            size="tiny"
            autoComplete="off"
            icon={<Search />}
            value={inputValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            name="keyword"
            id="keyword"
            placeholder="Filter by query"
            className="w-56"
            actions={[
              inputValue && (
                <Button
                  size="tiny"
                  type="text"
                  icon={<X />}
                  onClick={() => setInputValue('')}
                  className="p-0 h-5 w-5"
                />
              ),
            ]}
          />

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

          {showRolesFilter && (
            <FilterPopover
              name="Roles"
              options={roles}
              labelKey="name"
              valueKey="name"
              activeOptions={isLoadingRoles ? [] : filters.roles}
              onSaveFilters={onFilterRolesChange}
              className="w-56"
            />
          )}

          {isIndexAdvisorEnabled && (
            <Button
              type={indexAdvisor === 'true' ? 'default' : 'outline'}
              size="tiny"
              className={cn(indexAdvisor === 'true' ? 'bg-surface-300' : 'border-dashed')}
              onClick={onIndexAdvisorToggle}
              iconRight={indexAdvisor === 'true' ? <X size={14} /> : undefined}
            >
              <span className="flex items-center gap-x-2">
                <Lightbulb
                  size={12}
                  className={indexAdvisor === 'true' ? 'text-warning' : 'text-foreground-lighter'}
                />
                <span>Index Advisor</span>
              </span>
            </Button>
          )}

          {sort && (
            <div className="text-xs border rounded-md px-1.5 md:px-2.5 py-1 h-[26px] flex items-center gap-x-2">
              <p className="md:inline-flex gap-x-1 hidden truncate">
                Sort: {sort.column} <span className="text-foreground-lighter">{sort.order}</span>
              </p>
              <Tooltip>
                <TooltipTrigger onClick={clearSort}>
                  <X size={14} className="text-foreground-light hover:text-foreground" />
                </TooltipTrigger>
                <TooltipContent side="bottom">Clear sort</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 items-center pl-2">{actions}</div>
    </div>
  )
}
