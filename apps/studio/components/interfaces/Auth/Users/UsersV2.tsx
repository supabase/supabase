import dayjs from 'dayjs'
import { RefreshCw, Search, User as UserIcon, Users, X } from 'lucide-react'
import { UIEvent, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'

import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import APIDocsButton from 'components/ui/APIDocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useUsersInfiniteQuery } from 'data/auth/users-infinite-query'
import {
  Button,
  cn,
  LoadingLine,
  ResizablePanel,
  ResizablePanelGroup,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import AddUserDropdown from './AddUserDropdown'
import { UserPanel } from './UserPanel'
import { formatUsersData, isAtBottom } from './Users.utils'

type Filter = 'all' | 'verified' | 'unverified' | 'anonymous'
const USERS_TABLE_COLUMNS = [
  { id: 'img', name: '', minWidth: 65, width: 65, resizable: false },
  { id: 'id', name: 'UID', minWidth: undefined, width: 280, resizable: true },
  { id: 'name', name: 'Display name', minWidth: 0, width: 150, resizable: false },
  {
    id: 'email',
    name: 'Email',
    minWidth: undefined,
    width: 300,
    resizable: true,
  },
  { id: 'phone', name: 'Phone', minWidth: undefined, resizable: true },
  { id: 'providers', name: 'Providers', minWidth: 150, resizable: true },
  { id: 'provider_type', name: 'Provider type', minWidth: 150, resizable: true },
  {
    id: 'created_at',
    name: 'Created at',
    minWidth: undefined,
    width: 260,
    resizable: true,
  },
  {
    id: 'last_sign_in_at',
    name: 'Last sign in at',
    minWidth: undefined,
    width: 260,
    resizable: true,
  },
]

// [Joshen] Just naming it as V2 as its a rewrite of the old one, to make it easier for reviews
// Can change it to remove V2 thereafter
export const UsersV2 = () => {
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const gridRef = useRef<DataGridHandle>(null)
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [filterKeywords, setFilterKeywords] = useState('')
  const [selectedRow, setSelectedRow] = useState<number>()

  const {
    data,
    error,
    isLoading,
    isRefetching,
    isError,
    // hasNextPage,
    isFetchingNextPage,
    refetch,
    fetchNextPage,
  } = useUsersInfiniteQuery(
    {
      projectRef,
      keywords: filterKeywords,
      filter: filter === 'all' ? undefined : filter,
    },
    {
      keepPreviousData: Boolean(filterKeywords),
    }
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const totalUsers = useMemo(() => data?.pages[0].total, [data?.pages[0].total])
  const users = useMemo(() => data?.pages.flatMap((page) => page.users), [data?.pages])

  const usersTableColumns = USERS_TABLE_COLUMNS.map((col) => {
    const res: Column<any> = {
      key: col.id,
      name: col.name,
      resizable: col.resizable,
      sortable: false,
      width: col.width,
      minWidth: col.minWidth ?? 120,
      headerCellClass: 'z-50',
      renderHeaderCell: () => {
        if (col.id === 'img') return undefined
        return (
          <div className="flex items-center justify-between font-normal text-xs w-full">
            <div className="flex items-center gap-x-2">
              <p className="!text-foreground">{col.name}</p>
            </div>
          </div>
        )
      },
      renderCell: ({ row }) => {
        const value = row?.[col.id]
        const user = users?.find((u) => u.id === row.id)
        const formattedValue =
          value !== null && ['created_at', 'last_sign_in_at'].includes(col.id)
            ? dayjs(value).format('ddd DD MMM YYYY HH:mm:ss [GMT]ZZ')
            : Array.isArray(value)
              ? value.join(', ')
              : value
        const isConfirmed = user?.email_confirmed_at || user?.phone_confirmed_at

        if (col.id === 'img') {
          return (
            <div className="flex items-center justify-center">
              <div
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full bg-center bg-cover bg-no-repeat',
                  !row.img ? 'bg-selection' : 'border'
                )}
                style={{ backgroundImage: row.img ? `url('${row.img}')` : 'none' }}
              >
                {!row.img && <UserIcon size={12} />}
              </div>
            </div>
          )
        }

        return (
          <div
            className={cn(
              'w-full flex items-center text-xs',
              col.id.includes('provider') ? 'capitalize' : ''
            )}
          >
            {/* [Joshen] Not convinced this is the ideal way to display the icons, but for now */}
            {col.id === 'providers' &&
              row.provider_icons.map((icon: string, idx: number) => {
                const provider = row.providers[idx]
                return (
                  <div
                    className="min-w-6 min-h-6 rounded-full border flex items-center justify-center bg-surface-75"
                    style={{
                      marginLeft: idx === 0 ? 0 : `-8px`,
                      zIndex: row.provider_icons.length - idx,
                    }}
                  >
                    <img
                      key={`${user?.id}-${provider}`}
                      width={16}
                      src={icon}
                      alt={`${provider} auth icon`}
                      className={cn(provider === 'github' && 'dark:invert')}
                    />
                  </div>
                )
              })}
            {col.id === 'last_sign_in_at' && !isConfirmed ? (
              <p className="text-foreground-lighter">Waiting for verification</p>
            ) : (
              <p className={cn(col.id === 'providers' && 'ml-1')}>
                {formattedValue === null ? '-' : formattedValue}
              </p>
            )}
          </div>
        )
      },
    }
    return res
  })

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (isLoading || !isAtBottom(event)) return
    fetchNextPage()
  }

  const clearSearch = () => {
    setSearch('')
    setFilterKeywords('')
  }

  return (
    <div className="h-full flex flex-col">
      <FormHeader className="py-4 px-6 !mb-0" title="Users" />
      <div className="bg-surface-200 py-3 px-6 flex items-center justify-between border-t">
        <div className="flex items-center gap-x-2">
          <Input
            size="tiny"
            className="w-64 pl-7"
            iconContainerClassName="pl-2"
            icon={<Search size={14} className="text-foreground-lighter" />}
            placeholder="Search by email, phone number or UID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.code === 'Enter') setFilterKeywords(search)
            }}
            actions={[
              search && (
                <Button
                  size="tiny"
                  type="text"
                  icon={<X />}
                  onClick={() => clearSearch()}
                  className="px-1"
                />
              ),
            ]}
          />
          <Select_Shadcn_ value={filter} onValueChange={(val) => setFilter(val as Filter)}>
            <SelectTrigger_Shadcn_ size="tiny" className="w-[150px]">
              <SelectValue_Shadcn_ />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectGroup_Shadcn_>
                <SelectItem_Shadcn_ value="all">All users</SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="verified">Verified users</SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="unverified">Unverified users</SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="anonymous">Anonymous users</SelectItem_Shadcn_>
              </SelectGroup_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </div>
        <div className="flex items-center gap-2">
          {isNewAPIDocsEnabled && <APIDocsButton section={['user-management']} />}
          <Button
            size="tiny"
            icon={<RefreshCw />}
            type="default"
            loading={isRefetching && !isFetchingNextPage}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <AddUserDropdown projectKpsVersion={project?.kpsVersion} />
        </div>
      </div>
      <LoadingLine loading={isLoading || isRefetching} />
      <ResizablePanelGroup
        direction="horizontal"
        className="relative flex flex-grow bg-alternative min-h-0"
        autoSaveId="query-performance-layout-v1"
      >
        <ResizablePanel defaultSize={1}>
          <div className="flex flex-col w-full h-full">
            <DataGrid
              ref={gridRef}
              className="flex-grow border-t-0"
              rowHeight={44}
              headerRowHeight={36}
              columns={usersTableColumns}
              rows={formatUsersData(users ?? [])}
              rowClass={(_, idx) => {
                const isSelected = idx === selectedRow
                return [
                  `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200'} cursor-pointer`,
                  '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
                  '[&>.rdg-cell:first-child>div]:ml-4',
                ].join(' ')
              }}
              onScroll={handleScroll}
              renderers={{
                renderRow(idx, props) {
                  return (
                    <Row
                      {...props}
                      key={props.row.id}
                      onClick={() => {
                        if (typeof idx === 'number' && idx >= 0) {
                          setSelectedRow(idx)
                          gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
                        }
                      }}
                    />
                  )
                },
                noRowsFallback: isLoading ? (
                  <div className="absolute top-14 px-6 w-full">
                    <GenericSkeletonLoader />
                  </div>
                ) : isError ? (
                  <div className="absolute top-14 px-6 flex flex-col items-center justify-center w-full">
                    <AlertError subject="Failed to retrieve users" error={error} />
                  </div>
                ) : (
                  <div className="absolute top-20 px-6 flex flex-col items-center justify-center w-full gap-y-2">
                    <Users className="text-foreground-lighter" strokeWidth={1} />
                    <div className="text-center">
                      <p className="text-foreground">
                        {filter !== 'all' || filterKeywords.length > 0
                          ? 'No users found'
                          : 'No users in your project'}
                      </p>
                      <p className="text-foreground-light">
                        {filter !== 'all' || filterKeywords.length > 0
                          ? 'There are currently no users based on the filters applied'
                          : 'There are currently no users who signed up to your project'}
                      </p>
                    </div>
                  </div>
                ),
              }}
            />
          </div>
        </ResizablePanel>
        {selectedRow !== undefined && (
          <UserPanel
            selectedUser={users?.[selectedRow]}
            onClose={() => setSelectedRow(undefined)}
          />
        )}
      </ResizablePanelGroup>
      <div className="flex min-h-9 h-9 overflow-hidden items-center px-6 w-full border-t text-xs text-foreground-light">
        Total: {totalUsers} users
      </div>
    </div>
  )
}
