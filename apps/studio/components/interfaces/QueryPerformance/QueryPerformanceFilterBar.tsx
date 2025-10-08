import { useDebounce } from '@uidotdev/usehooks'
import { RefreshCw, Search, X } from 'lucide-react'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { ChangeEvent, useEffect, useState } from 'react'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { DownloadResultsButton } from 'components/ui/DownloadResultsButton'
import { FilterPopover } from 'components/ui/FilterPopover'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { useQueryPerformanceSort } from './hooks/useQueryPerformanceSort'

export const QueryPerformanceFilterBar = ({
  queryPerformanceQuery,
  onResetReportClick,
}: {
  queryPerformanceQuery: DbQueryHook<any>
  onResetReportClick?: () => void
}) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { sort, clearSort } = useQueryPerformanceSort()
  const [showBottomSection] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.QUERY_PERF_SHOW_BOTTOM_SECTION,
    true
  )

  const [{ search: searchQuery, roles: defaultFilterRoles }, setSearchParams] = useQueryStates({
    search: parseAsString.withDefault(''),
    roles: parseAsArrayOf(parseAsString).withDefault([]),
  })

  const [inputValue, setInputValue] = useState(searchQuery)
  const debouncedInputValue = useDebounce(inputValue, 500)
  const searchValue = inputValue.length === 0 ? inputValue : debouncedInputValue

  const [filters, setFilters] = useState<{ roles: string[]; query: string }>({
    roles: defaultFilterRoles,
    query: '',
  })

  const { isLoading, isRefetching } = queryPerformanceQuery
  const { data, isLoading: isLoadingRoles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const roles = (data ?? []).sort((a, b) => a.name.localeCompare(b.name))

  const onFilterRolesChange = (roles: string[]) => {
    setFilters({ ...filters, roles })
    setSearchParams({ roles })
  }

  const onSearchQueryChange = (value: string) => {
    setSearchParams({ search: value || '' })
  }

  useEffect(() => {
    onSearchQueryChange(searchValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  return (
    <div className="px-4 py-2 bg-surface-200 border-t -mt-px flex justify-between items-center overflow-x-auto overflow-y-hidden w-full">
      <div className="flex items-center gap-x-4">
        <div className="flex items-center gap-x-2">
          <Input
            size="tiny"
            autoComplete="off"
            icon={<Search size={12} />}
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

          <FilterPopover
            name="Roles"
            options={roles}
            labelKey="name"
            valueKey="name"
            activeOptions={isLoadingRoles ? [] : filters.roles}
            onSaveFilters={onFilterRolesChange}
            className="w-56"
          />

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

      <div className="flex gap-2 items-center pl-2">
        {!showBottomSection && onResetReportClick && (
          <Button type="default" onClick={() => onResetReportClick()}>
            Reset report
          </Button>
        )}
        <Button
          size="tiny"
          type="default"
          onClick={() => queryPerformanceQuery.runQuery()}
          disabled={isLoading || isRefetching}
          icon={
            <RefreshCw
              className={`text-foreground-light ${isLoading || isRefetching ? 'animate-spin' : ''}`}
            />
          }
        >
          Refresh
        </Button>
        <DownloadResultsButton
          results={queryPerformanceQuery.data ?? []}
          fileName={`Supabase Query Performance (${ref})`}
          align="end"
        />
      </div>
    </div>
  )
}
