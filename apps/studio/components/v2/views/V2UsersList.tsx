'use client'

import { SortDropdown } from 'components/interfaces/Auth/Users/SortDropdown'
import { useUsersCountQuery } from 'data/auth/users-count-query'
import { useUsersInfiniteQuery } from 'data/auth/users-infinite-query'
import type { User, Filter as UserTypeFilter } from 'data/auth/users-infinite-query'
import { isValidConnString } from 'data/fetchers'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import { ResizablePanel, ResizablePanelGroup } from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { AddUserDropdown } from '@/components/interfaces/Auth/Users/AddUserDropdown'
import { UserPanel } from '@/components/interfaces/Auth/Users/UserPanel'
import { PROVIDER_FILTER_OPTIONS } from '@/components/interfaces/Auth/Users/Users.constants'
import { DataTableRenderer } from '@/components/v2/DataTableRenderer'
import type { DataTableColumn, FilterState, SortState } from '@/components/v2/DataTableRenderer'

const PAGE_SIZE = 50

const USERS_COLUMNS: DataTableColumn<User>[] = [
  {
    id: 'email',
    name: 'Email',
    width: 280,
    minWidth: 160,
    type: 'avatar',
    renderCell: (_v, row) => (
      <div className="flex items-center gap-2 truncate">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 text-[10px] font-semibold text-brand">
          {row.email ? row.email[0].toUpperCase() : '?'}
        </span>
        <span className="truncate text-[13px]">
          {row.email ?? <span className="italic text-foreground-lighter">no email</span>}
        </span>
      </div>
    ),
  },
  {
    id: 'phone',
    name: 'Phone',
    width: 160,
    type: 'text',
    renderCell: (_v, row) =>
      row.phone ? (
        <span className="truncate">{row.phone}</span>
      ) : (
        <span className="text-foreground-lighter italic">-</span>
      ),
  },
  {
    id: 'providers',
    name: 'Provider',
    width: 140,
    type: 'badge',
    renderCell: (_v, row) => {
      const providers = row.providers ?? []
      if (providers.length === 0) return <span className="text-foreground-lighter">-</span>
      return (
        <div className="flex gap-1 truncate">
          {providers.slice(0, 2).map((p: string) => (
            <span
              key={p}
              className="inline-flex items-center rounded border border-border bg-surface-300 px-1.5 py-0.5 leading-none text-[11px]"
            >
              {p}
            </span>
          ))}
          {providers.length > 2 && (
            <span className="text-[11px] text-foreground-lighter">+{providers.length - 2}</span>
          )}
        </div>
      )
    },
  },
  {
    id: 'created_at',
    name: 'Created',
    width: 140,
    type: 'datetime',
  },
  {
    id: 'last_sign_in_at',
    name: 'Last sign in',
    width: 140,
    type: 'datetime',
  },
]

export function V2UsersList() {
  const { projectRef } = useV2Params()
  const [selectedId, setSelectedId] = useQueryState(
    'show',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )
  const [search, setSearch] = useState('')
  const [filterUserType, setFilterUserType] = useState<'all' | UserTypeFilter>('all')
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [sort, setSort] = useState<SortState | null>(null)
  const {
    authenticationShowSortByEmail: showSortByEmail,
    authenticationShowSortByPhone: showSortByPhone,
  } = useIsFeatureEnabled([
    'authentication:show_sort_by_email',
    'authentication:show_sort_by_phone',
  ])

  const sortColumn =
    (sort?.columnId as 'created_at' | 'email' | 'id' | 'phone' | 'last_sign_in_at') ?? 'created_at'
  const sortOrder = sort?.direction ?? 'asc'
  const sortByValue = `${sortColumn}:${sortOrder}`

  const [page, setPage] = useState(1)

  const { data: project, isLoading: isProjectLoading } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  const shouldFetch = Boolean(projectRef) && isValidConnString(project?.connectionString)

  const { data: countData } = useUsersCountQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      keywords: search || undefined,
      filter: filterUserType === 'all' ? undefined : filterUserType,
      providers: selectedProviders,
    },
    { enabled: shouldFetch }
  )
  const total = countData?.count ?? 0

  const {
    data,
    isPending: isUsersPending,
    isError,
    error,
    fetchNextPage,
    isFetchingNextPage,
  } = useUsersInfiniteQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      keywords: search || undefined,
      filter: filterUserType === 'all' ? undefined : filterUserType,
      providers: selectedProviders,
      sort: sortColumn,
      order: sortOrder,
    },
    { enabled: shouldFetch }
  )

  const allUsers = data?.pages.flatMap((p) => p.result) ?? []
  const pageUsers = allUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handlePageChange = async (nextPage: number) => {
    const pagesNeeded = Math.ceil((nextPage * PAGE_SIZE) / PAGE_SIZE)
    const pagesLoaded = data?.pages.length ?? 0
    if (pagesNeeded > pagesLoaded) {
      await fetchNextPage()
    }
    setPage(nextPage)
  }

  const handleSortChange = (s: SortState | null) => {
    setSort(s ?? { columnId: 'created_at', direction: 'asc' })
    setPage(1)
  }

  const handleSortByValue = (value: string) => {
    const [columnId, direction] = value.split(':') as [
      SortState['columnId'],
      SortState['direction'],
    ]
    setSort({ columnId, direction })
    setPage(1)
  }

  const handleFilterChange = (state: FilterState) => {
    const newSearch = (state['search'] as string) ?? ''
    const newUserType = (state['userType'] as 'all' | UserTypeFilter) ?? 'all'
    const newProviders = Array.isArray(state['providers'])
      ? (state['providers'] as string[])
      : ([] as string[])

    if (newSearch !== search) {
      setSearch(newSearch)
      setPage(1)
    }
    if (newUserType !== filterUserType) {
      setFilterUserType(newUserType)
      setPage(1)
    }
    if (newProviders.join(',') !== selectedProviders.join(',')) {
      setSelectedProviders(newProviders)
      setPage(1)
    }
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="relative flex flex-grow bg-alternative min-h-0"
      autoSaveId="v2-auth-users-layout"
    >
      <ResizablePanel>
        <DataTableRenderer<User>
          columns={USERS_COLUMNS}
          rows={pageUsers}
          rowKey="id"
          isLoading={isProjectLoading || (shouldFetch && isUsersPending && !isFetchingNextPage)}
          error={isError ? (error as Error) : null}
          sort={sort}
          onSortChange={handleSortChange}
          renderSortControl={() => (
            <SortDropdown
              specificFilterColumn="freeform"
              sortColumn={sortColumn}
              sortOrder={sortOrder}
              sortByValue={sortByValue}
              showSortByEmail={showSortByEmail}
              showSortByPhone={showSortByPhone}
              setSortByValue={handleSortByValue}
              improvedSearchEnabled
            />
          )}
          filters={[
            {
              id: 'search',
              label: 'Search',
              type: 'search',
              placeholder: 'Search by email or phone...',
            },
            {
              id: 'userType',
              label: 'User type',
              type: 'select',
              options: [
                { value: 'all', label: 'All users' },
                { value: 'verified', label: 'Verified users' },
                { value: 'unverified', label: 'Unverified users' },
                { value: 'anonymous', label: 'Anonymous users' },
              ],
            },
            {
              id: 'providers',
              label: 'Provider',
              type: 'multi-select',
              options: PROVIDER_FILTER_OPTIONS.map((provider) => ({
                value: provider.value,
                label: provider.name,
              })),
            },
          ]}
          filterState={{ search, userType: filterUserType, providers: selectedProviders }}
          onFilterChange={handleFilterChange}
          toolbarRight={<AddUserDropdown />}
          pagination={{
            page,
            pageSize: PAGE_SIZE,
            total,
          }}
          onPageChange={handlePageChange}
          onRowClick={(row) => {
            if (!row.id) return
            setSelectedId(row.id)
          }}
          selectable
          emptyState={{
            title: 'No users found',
            description: search
              ? 'No users match your search.'
              : 'There are no users in this project yet.',
          }}
        />
      </ResizablePanel>
      {!!selectedId && <UserPanel />}
    </ResizablePanelGroup>
  )
}