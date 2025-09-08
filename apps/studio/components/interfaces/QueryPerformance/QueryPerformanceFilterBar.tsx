import { RefreshCw, Search } from 'lucide-react'
import { parseAsString, parseAsArrayOf, useQueryStates } from 'nuqs'
import { useState, useEffect } from 'react'
import { useDebounce } from '@uidotdev/usehooks'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { DownloadResultsButton } from 'components/ui/DownloadResultsButton'
import { FilterPopover } from 'components/ui/FilterPopover'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, Input } from 'ui'

export const QueryPerformanceFilterBar = ({
  queryPerformanceQuery,
  onResetReportClick,
}: {
  queryPerformanceQuery: DbQueryHook<any>
  onResetReportClick?: () => void
}) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [showBottomSection] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.QUERY_PERF_SHOW_BOTTOM_SECTION,
    true
  )

  const [{ search: searchQuery, roles: defaultFilterRoles }, setSearchParams] = useQueryStates({
    search: parseAsString.withDefault(''),
    roles: parseAsArrayOf(parseAsString).withDefault([]),
  })

  const onSearchQueryChange = (value: string) => {
    setSearchParams({ search: value || '' })
  }

  const [inputValue, setInputValue] = useState(searchQuery)
  const debouncedInputValue = useDebounce(inputValue, 500)

  useEffect(() => {
    onSearchQueryChange(debouncedInputValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInputValue])

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

  return (
    <div className="px-6 py-2 bg-surface-200 border-t -mt-px flex justify-between items-center">
      <div className="flex items-center gap-x-4">
        <div className="flex items-center gap-x-2">
          <Input
            size="tiny"
            autoComplete="off"
            icon={<Search size={12} />}
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            name="keyword"
            id="keyword"
            placeholder="Filter by query"
            className="w-48"
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
        </div>
      </div>

      <div className="flex gap-2 items-center">
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
