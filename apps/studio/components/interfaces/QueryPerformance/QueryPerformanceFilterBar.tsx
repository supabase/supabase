import { ArrowDown, ArrowUp, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FilterPopover } from 'components/ui/FilterPopover'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { useLocalStorageQuery } from 'hooks'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'
import { QueryPerformanceSort } from '../Reports/Reports.queries'
import { TextSearchPopover } from './TextSearchPopover'

export const QueryPerformanceFilterBar = ({
  queryPerformanceQuery,
  onResetReportClick,
}: {
  queryPerformanceQuery: DbQueryHook<any>
  onResetReportClick?: () => void
}) => {
  const router = useRouter()
  const { project } = useProjectContext()
  const [showBottomSection] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.QUERY_PERF_SHOW_BOTTOM_SECTION,
    true
  )
  const defaultSearchQueryValue = router.query.search ? String(router.query.search) : ''
  const defaultFilterRoles = router.query.roles ? (router.query.roles as string[]) : []
  const defaultSortByValue = router.query.sort
    ? ({ column: router.query.sort, order: router.query.order } as QueryPerformanceSort)
    : undefined

  const [searchInputVal, setSearchInputVal] = useState(defaultSearchQueryValue)
  const [filters, setFilters] = useState<{ roles: string[]; query: string }>({
    roles: typeof defaultFilterRoles === 'string' ? [defaultFilterRoles] : defaultFilterRoles,
    query: '',
  })
  // [Joshen] This is for the old UI, can deprecated after
  const [sortByValue, setSortByValue] = useState<QueryPerformanceSort>(
    defaultSortByValue ?? { column: 'prop_total_time', order: 'desc' }
  )

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

  function getSortButtonLabel() {
    if (defaultSortByValue?.order === 'desc') {
      return 'Sorted by latency - high to low'
    } else {
      return 'Sorted by latency - low to high'
    }
  }

  const onSortChange = (order: 'asc' | 'desc') => {
    setSortByValue({ column: 'prop_total_time', order })
    router.push({ ...router, query: { ...router.query, sort: 'prop_total_time', order } })
  }

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-x-4">
        <div className="flex items-center gap-x-2">
          <p className="text-xs prose">Filter by</p>
          <FilterPopover
            name="Roles"
            options={roles}
            labelKey="name"
            valueKey="name"
            activeOptions={isLoadingRoles ? [] : filters.roles}
            onSaveFilters={onFilterRolesChange}
          />
          <TextSearchPopover name="Query" value={searchInputVal} onSaveText={onSearchQueryChange} />

          <div className="border-r border-strong h-6" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button icon={sortByValue?.order === 'desc' ? <ArrowDown /> : <ArrowUp />}>
                {getSortButtonLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuRadioGroup
                value={sortByValue?.order}
                onValueChange={(value: any) => onSortChange(value)}
              >
                <DropdownMenuRadioItem value="desc" defaultChecked={sortByValue?.order === 'desc'}>
                  Sort by latency - high to low
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="asc" defaultChecked={sortByValue?.order === 'asc'}>
                  Sort by latency - low to high
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {!showBottomSection && onResetReportClick && (
          <Button
            onClick={() => {
              onResetReportClick()
            }}
            type="default"
          >
            Reset report
          </Button>
        )}
        <Button
          type="default"
          size="tiny"
          onClick={() => queryPerformanceQuery.runQuery()}
          disabled={isLoading || isRefetching}
          icon={
            <RefreshCw
              size={12}
              className={`text-foreground-light ${isLoading || isRefetching ? 'animate-spin' : ''}`}
            />
          }
        >
          Refresh
        </Button>
      </div>
    </div>
  )
}
