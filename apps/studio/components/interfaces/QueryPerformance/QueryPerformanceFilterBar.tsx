import { RefreshCw, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'

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
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [showBottomSection] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.QUERY_PERF_SHOW_BOTTOM_SECTION,
    true
  )

  const defaultSearchQueryValue = router.query.search ? String(router.query.search) : ''
  const defaultFilterRoles = router.query.roles ? (router.query.roles as string[]) : []

  const [searchInputVal, setSearchInputVal] = useState(defaultSearchQueryValue)
  const [filters, setFilters] = useState<{ roles: string[]; query: string }>({
    roles: typeof defaultFilterRoles === 'string' ? [defaultFilterRoles] : defaultFilterRoles,
    query: '',
  })

  const { isLoading, isRefetching } = queryPerformanceQuery
  const { data, isLoading: isLoadingRoles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const roles = (data ?? []).sort((a, b) => a.name.localeCompare(b.name))

  const onSearchQueryChange = (value: string) => {
    setSearchInputVal(value)

    if (!value || typeof value !== 'string') {
      // if user has deleted the search query, remove it from the url
      const { search, ...rest } = router.query
      router.push({ ...router, query: { ...rest } })
    } else {
      router.push({ ...router, query: { ...router.query, search: value } })
    }
  }

  const onFilterRolesChange = (roles: string[]) => {
    setFilters({ ...filters, roles })
    router.push({ ...router, query: { ...router.query, roles } })
  }

  return (
    <div className="px-6 py-2 bg-surface-200 border-t -mt-px flex justify-between items-center">
      <div className="flex items-center gap-x-4">
        <div className="flex items-center gap-x-2">
          <Input
            size="tiny"
            autoComplete="off"
            icon={<Search size={12} />}
            value={searchInputVal}
            onChange={(e: any) => onSearchQueryChange(e.target.value)}
            name="keyword"
            id="keyword"
            placeholder="Filter by keyword"
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
