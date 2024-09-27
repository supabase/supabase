import AwesomeDebouncePromise from 'awesome-debounce-promise'
import dayjs from 'dayjs'
import { ArrowDown, ArrowUp, RefreshCw, Search, User as UserIcon, Users, X } from 'lucide-react'
import { UIEvent, useEffect, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'

import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import APIDocsButton from 'components/ui/APIDocsButton'
import { FilterPopover } from 'components/ui/FilterPopover'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useUsersInfiniteQuery } from 'data/auth/users-infinite-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
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
import { PROVIDER_FILTER_OPTIONS } from './Users.constants'
import { formatUsersData, isAtBottom } from './Users.utils'
import { HeaderCell } from './UsersGridComponents'

type Filter = 'all' | 'verified' | 'unverified' | 'anonymous'
const USERS_TABLE_COLUMNS = [
  { id: 'img', name: '', minWidth: 65, width: 65, resizable: false },
  { id: 'id', name: 'UID', width: 280 },
  { id: 'name', name: 'Display name', minWidth: 0, width: 150 },
  { id: 'email', name: 'Email', width: 300 },
  { id: 'phone', name: 'Phone', minWidth: undefined },
  { id: 'providers', name: 'Providers', minWidth: 150 },
  { id: 'provider_type', name: 'Provider type', minWidth: 150 },
  { id: 'created_at', name: 'Created at', width: 260 },
  { id: 'last_sign_in_at', name: 'Last sign in at', width: 260 },
]

// [Joshen] Just naming it as V2 as its a rewrite of the old one, to make it easier for reviews
// Can change it to remove V2 thereafter
export const UsersV2 = () => {
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const gridRef = useRef<DataGridHandle>(null)
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()

  const [columns, setColumns] = useState<Column<any>[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [filterKeywords, setFilterKeywords] = useState('')
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedRow, setSelectedRow] = useState<number>()
  const [sortByValue, setSortByValue] = useState<string>('created_at:desc')
  const [
    columnConfiguration,
    setColumnConfiguration,
    { isSuccess: isSuccessStorage, isError: isErrorStorage, error: errorStorage },
  ] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.AUTH_USERS_COLUMNS_CONFIGURATION(projectRef ?? ''),
    undefined as { id: string; width: number; visible: boolean }[] | undefined
  )

  const [sortColumn, sortOrder] = sortByValue.split(':')

  const {
    data,
    error,
    isLoading,
    isRefetching,
    isError,
    isFetchingNextPage,
    refetch,
    fetchNextPage,
  } = useUsersInfiniteQuery(
    {
      projectRef,
      keywords: filterKeywords,
      filter: filter === 'all' ? undefined : filter,
      providers: selectedProviders,
      sort: sortColumn as 'created_at' | 'email' | 'phone',
      order: sortOrder as 'asc' | 'desc',
    },
    {
      keepPreviousData: Boolean(filterKeywords),
    }
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const totalUsers = useMemo(() => data?.pages[0].total, [data?.pages[0].total])
  const users = useMemo(() => data?.pages.flatMap((page) => page.users), [data?.pages])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (isLoading || !isAtBottom(event)) return
    fetchNextPage()
  }

  const clearSearch = () => {
    setSearch('')
    setFilterKeywords('')
  }

  const swapColumns = (data: any[], sourceIdx: number, targetIdx: number) => {
    const updatedColumns = data.slice()
    const [removed] = updatedColumns.splice(sourceIdx, 1)
    updatedColumns.splice(targetIdx, 0, removed)
    return updatedColumns
  }

  const saveColumnConfiguration = AwesomeDebouncePromise((event: 'resize' | 'reorder', value) => {
    if (event === 'resize') {
      const columnConfig = columns.map((col, idx) => ({
        id: col.key,
        width: idx === value.idx ? value.width : col.width,
        visible: true,
      }))
      setColumnConfiguration(columnConfig)
    } else if (event === 'reorder') {
      const columnConfig = swapColumns(columns, value.sourceIdx, value.targetIdx).map((col) => ({
        id: col.key,
        width: col.width,
        visible: true,
      }))
      setColumnConfiguration(columnConfig)
    }
  }, 500)

  useEffect(() => {
    if (
      isSuccessStorage ||
      (isErrorStorage && (errorStorage as Error).message.includes('data is undefined'))
    ) {
      const columnOrder =
        columnConfiguration?.map((c) => c.id) ?? USERS_TABLE_COLUMNS.map((c) => c.id)
      const columns = USERS_TABLE_COLUMNS.map((col) => {
        const savedConfig = columnConfiguration?.find((c) => c.id === col.id)

        const res: Column<any> = {
          key: col.id,
          name: col.name,
          resizable: col.resizable ?? true,
          sortable: false,
          draggable: true,
          width: savedConfig?.width ?? col.width,
          minWidth: col.minWidth ?? 120,
          headerCellClass: 'z-50 outline-none !shadow-none',
          renderHeaderCell: () => {
            if (col.id === 'img') return undefined
            return <HeaderCell col={col} setSortByValue={setSortByValue} />
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
      }).sort((a: any, b: any) => {
        return columnOrder.indexOf(a.key) - columnOrder.indexOf(b.key)
      })

      setColumns(columns)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessStorage, isErrorStorage, errorStorage])

  return (
    <div className="h-full flex flex-col">
      <FormHeader className="py-4 px-6 !mb-0" title="Users" />
      <div className="bg-surface-200 py-3 px-6 flex items-center justify-between border-t">
        <div className="flex items-center gap-x-2">
          <p className="text-xs text-foreground-light">Filter by</p>

          <Input
            size="tiny"
            className="w-52 pl-7 bg-transparent"
            iconContainerClassName="pl-2"
            icon={<Search size={14} className="text-foreground-lighter" />}
            placeholder="Search email, phone or UID"
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
                  className="p-0 h-5 w-5"
                />
              ),
            ]}
          />

          <Select_Shadcn_ value={filter} onValueChange={(val) => setFilter(val as Filter)}>
            <SelectTrigger_Shadcn_
              size="tiny"
              className={cn('w-[140px] !bg-transparent', filter === 'all' && 'border-dashed')}
            >
              <SelectValue_Shadcn_ />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectGroup_Shadcn_>
                <SelectItem_Shadcn_ value="all" className="text-xs">
                  All users
                </SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="verified" className="text-xs">
                  Verified users
                </SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="unverified" className="text-xs">
                  Unverified users
                </SelectItem_Shadcn_>
                <SelectItem_Shadcn_ value="anonymous" className="text-xs">
                  Anonymous users
                </SelectItem_Shadcn_>
              </SelectGroup_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>

          <FilterPopover
            name="Provider"
            options={PROVIDER_FILTER_OPTIONS}
            labelKey="name"
            valueKey="value"
            iconKey="icon"
            activeOptions={selectedProviders}
            labelClass="text-xs"
            maxHeightClass="h-[190px]"
            onSaveFilters={setSelectedProviders}
          />

          <div className="border-r border-strong h-6" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button icon={sortOrder === 'desc' ? <ArrowDown /> : <ArrowUp />}>
                Sorted by {sortColumn.replace('_', ' ')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="start">
              <DropdownMenuRadioGroup value={sortByValue} onValueChange={setSortByValue}>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Sort by created at</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioItem value="created_at:asc">Ascending</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="created_at:desc">
                      Descending
                    </DropdownMenuRadioItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Sort by email</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioItem value="email:asc">Ascending</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="email:desc">Descending</DropdownMenuRadioItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Sort by phone</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioItem value="phone:asc">Ascending</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="phone:desc">Descending</DropdownMenuRadioItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
              columns={columns}
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
              onColumnResize={(idx, width) => saveColumnConfiguration('resize', { idx, width })}
              onColumnsReorder={(source, target) => {
                const sourceIdx = columns.findIndex((col) => col.key === source)
                const targetIdx = columns.findIndex((col) => col.key === target)

                const updatedColumns = swapColumns(columns, sourceIdx, targetIdx)
                setColumns(updatedColumns)

                saveColumnConfiguration('reorder', { sourceIdx, targetIdx })
              }}
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
