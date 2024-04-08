import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FilterPopover } from 'components/ui/FilterPopover'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
import { Button } from 'ui'
import { TextSearchPopover } from './TextSearchPopover'

export const QueryPerformanceFilterBar = ({
  queryPerformanceQuery,
}: {
  queryPerformanceQuery: DbQueryHook<any>
}) => {
  const router = useRouter()
  const { project } = useProjectContext()
  const defaultSearchQueryValue = router.query.search ? String(router.query.search) : ''
  const defaultSortByValue = router.query.sort ? String(router.query.sort) : 'lat_desc'
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
        </div>
      </div>

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
  )
}
