import { ArrowDown, ArrowUp, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FilterPopover } from 'components/ui/FilterPopover'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'
import { TextSearchPopover } from './TextSearchPopover'

export const QueryPerformanceFilterBar = ({
  isLoading,
  onRefreshClick,
}: {
  isLoading: boolean
  onRefreshClick: () => void
}) => {
  const router = useRouter()
  const { project } = useProjectContext()
  const defaultSearchQueryValue = router.query.search ? String(router.query.search) : ''
  const defaultSortByValue = router.query.sort ? String(router.query.sort) : 'lat_desc'
  const defaultFilterRoles = router.query.roles ? (router.query.roles as string[]) : []

  const [sortByValue, setSortByValue] = useState(defaultSortByValue)
  const [searchInputVal, setSearchInputVal] = useState(defaultSearchQueryValue)
  const [filters, setFilters] = useState<{ roles: string[]; query: string }>({
    roles: typeof defaultFilterRoles === 'string' ? [defaultFilterRoles] : defaultFilterRoles,
    query: '',
  })

  const { data, isLoading: isLoadingRoles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const roles = (data ?? []).sort((a, b) => a.name.localeCompare(b.name))

  function getSortButtonLabel() {
    const sort = router.query.sort as 'lat_desc' | 'lat_asc'

    if (sort === 'lat_desc') {
      return 'Sorted by latency - high to low'
    } else {
      return 'Sorted by latency - low to high'
    }
  }

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

  const onSortChange = (sort: string) => {
    setSortByValue(sort)
    router.push({ ...router, query: { ...router.query, sort } })
  }

  const ButtonIcon = sortByValue === 'lat_desc' ? ArrowDown : ArrowUp

  return (
    <div className="flex justify-between items-center mb-3">
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
        <div className="border-r border-strong h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button icon={<ButtonIcon />}>{getSortButtonLabel()}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuRadioGroup value={sortByValue} onValueChange={onSortChange}>
              <DropdownMenuRadioItem
                value="lat_desc"
                defaultChecked={router.query.sort === 'lat_desc'}
              >
                Sort by latency - high to low
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="lat_asc"
                defaultChecked={router.query.sort === 'lat_asc'}
              >
                Sort by latency - low to high
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button
        type="default"
        size="tiny"
        onClick={onRefreshClick}
        disabled={isLoading ? true : false}
        icon={
          <RefreshCw
            size={12}
            className={`text-foreground-light ${isLoading ? 'animate-spin' : ''}`}
          />
        }
      >
        {isLoading ? 'Refreshing' : 'Refresh'}
      </Button>
    </div>
  )
}
