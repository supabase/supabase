import { useQueryClient } from '@tanstack/react-query'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import {
  ArrowDown,
  ArrowDownNarrowWide,
  ArrowDownWideNarrow,
  ArrowUp,
  HelpCircle,
  Loader2,
  LoaderPinwheel,
  RefreshCw,
  Search,
  Trash,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { UIEvent, useEffect, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import AlertError from 'components/ui/AlertError'
import { APIDocsButton } from 'components/ui/APIDocsButton'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FilterPopover } from 'components/ui/FilterPopover'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { authKeys } from 'data/auth/keys'
import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { User, useUsersInfiniteQuery } from 'data/auth/users-infinite-query'
import { THRESHOLD_COUNT } from 'data/table-rows/table-rows-count-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { cleanPointerEventsNoneOnBody, isAtBottom } from 'lib/helpers'
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { AddUserDropdown } from './AddUserDropdown'
import { DeleteUserModal } from './DeleteUserModal'
import { UserPanel } from './UserPanel'
import {
  ColumnConfiguration,
  MAX_BULK_DELETE,
  PROVIDER_FILTER_OPTIONS,
  USERS_TABLE_COLUMNS,
  UUIDV4_LEFT_PREFIX_REGEX,
  PHONE_NUMBER_LEFT_PREFIX_REGEX,
} from './Users.constants'
import { formatUserColumns, formatUsersData } from './Users.utils'

export type Filter = 'all' | 'verified' | 'unverified' | 'anonymous'

// [Joshen] Just naming it as V2 as its a rewrite of the old one, to make it easier for reviews
// Can change it to remove V2 thereafter
export const UsersV2 = () => {
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const gridRef = useRef<DataGridHandle>(null)
  const xScroll = useRef<number>(0)
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()

  const {
    authenticationShowProviderFilter: showProviderFilter,
    authenticationShowSortByEmail: showSortByEmail,
    authenticationShowSortByPhone: showSortByPhone,
    authenticationShowUserTypeFilter: showUserTypeFilter,
    authenticationShowEmailPhoneColumns: showEmailPhoneColumns,
  } = useIsFeatureEnabled([
    'authentication:show_provider_filter',
    'authentication:show_sort_by_email',
    'authentication:show_sort_by_phone',
    'authentication:show_user_type_filter',
    'authentication:show_email_phone_columns',
  ])

  const userTableColumns = useMemo(() => {
    if (showEmailPhoneColumns) return USERS_TABLE_COLUMNS
    else {
      return USERS_TABLE_COLUMNS.filter((col) => {
        if (col.id === 'email' || col.id === 'phone') return false
        return true
      })
    }
  }, [showEmailPhoneColumns])

  const [mode, setMode] = useState<'performance' | 'freeform'>('performance' as const)
  const [column, setColumn] = useState<'id' | 'email' | 'phone'>('id' as const)

  const [columns, setColumns] = useState<Column<any>[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [filterKeywords, setFilterKeywords] = useState('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [sortByValue, setSortByValue] = useState<string>('id:asc')

  const [selectedUser, setSelectedUser] = useState<string>()
  const [selectedUsers, setSelectedUsers] = useState<Set<any>>(new Set([]))
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<User>()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeletingUsers, setIsDeletingUsers] = useState(false)

  const [forceExactCount, setForceExactCount] = useState(false)
  const [showFetchExactCountModal, setShowFetchExactCountModal] = useState(false)

  const [
    columnConfiguration,
    setColumnConfiguration,
    { isSuccess: isSuccessStorage, isError: isErrorStorage, error: errorStorage },
  ] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.AUTH_USERS_COLUMNS_CONFIGURATION(projectRef ?? ''),
    null as ColumnConfiguration[] | null
  )

  const [sortColumn, sortOrder] = sortByValue.split(':')

  const {
    data,
    error,
    isSuccess,
    isLoading,
    isRefetching,
    isError,
    isFetchingNextPage,
    refetch,
    hasNextPage,
    fetchNextPage,
  } = useUsersInfiniteQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      keywords: filterKeywords,
      filter: mode === 'performance' || filter === 'all' ? undefined : filter,
      providers: selectedProviders,
      sort: sortColumn as 'id' | 'created_at' | 'email' | 'phone',
      order: sortOrder as 'asc' | 'desc',

      ...(mode === 'performance' ? { column } : { column: undefined }),
    },
    {
      keepPreviousData: Boolean(filterKeywords),
      // [Joshen] This is to prevent the dashboard from invalidating when refocusing as it may create
      // a barrage of requests to invalidate each page esp when the project has many many users.
      staleTime: Infinity,
    }
  )

  const { mutateAsync: deleteUser } = useUserDeleteMutation()

  const users = useMemo(() => data?.pages.flatMap((page) => page.result) ?? [], [data?.pages])
  // [Joshen] Only relevant for when selecting one user only
  const selectedUserFromCheckbox = users.find((u) => u.id === [...selectedUsers][0])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const isScrollingHorizontally = xScroll.current !== event.currentTarget.scrollLeft
    xScroll.current = event.currentTarget.scrollLeft

    if (
      isLoading ||
      isFetchingNextPage ||
      isScrollingHorizontally ||
      !isAtBottom(event) ||
      !hasNextPage
    ) {
      return
    }
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

  // [Joshen] Left off here - it's tricky trying to do both column toggling and re-ordering
  const saveColumnConfiguration = AwesomeDebouncePromise(
    (event: 'resize' | 'reorder' | 'toggle', value) => {
      if (event === 'toggle') {
        const columnConfig = value.columns.map((col: any) => ({
          id: col.key,
          width: col.width,
        }))
        setColumnConfiguration(columnConfig)
      } else if (event === 'resize') {
        const columnConfig = columns.map((col, idx) => ({
          id: col.key,
          width: idx === value.idx ? value.width : col.width,
        }))
        setColumnConfiguration(columnConfig)
      } else if (event === 'reorder') {
        const columnConfig = value.columns.map((col: any) => ({
          id: col.key,
          width: col.width,
        }))
        setColumnConfiguration(columnConfig)
      }
    },
    500
  )

  const handleDeleteUsers = async () => {
    if (!projectRef) return console.error('Project ref is required')
    const userIds = [...selectedUsers]

    setIsDeletingUsers(true)
    try {
      await Promise.all(
        userIds.map((id) => deleteUser({ projectRef, userId: id, skipInvalidation: true }))
      )
      // [Joshen] Skip invalidation within RQ to prevent multiple requests, then invalidate once at the end
      await Promise.all([queryClient.invalidateQueries(authKeys.usersInfinite(projectRef))])
      toast.success(
        `Successfully deleted the selected ${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''}`
      )
      setShowDeleteModal(false)
      setSelectedUsers(new Set([]))

      if (userIds.includes(selectedUser)) setSelectedUser(undefined)
    } catch (error: any) {
      toast.error(`Failed to delete selected users: ${error.message}`)
    } finally {
      setIsDeletingUsers(false)
    }
  }

  useEffect(() => {
    if (
      !isRefetching &&
      (isSuccessStorage ||
        (isErrorStorage && (errorStorage as Error).message.includes('data is undefined')))
    ) {
      const columns = formatUserColumns({
        columns: userTableColumns,
        config: columnConfiguration ?? [],
        users: users ?? [],
        visibleColumns: selectedColumns,
        setSortByValue,
        onSelectDeleteUser: setSelectedUserToDelete,
      })
      setColumns(columns)
      if (columns.length < userTableColumns.length) {
        setSelectedColumns(columns.filter((col) => col.key !== 'img').map((col) => col.key))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isSuccess,
    isRefetching,
    isSuccessStorage,
    isErrorStorage,
    errorStorage,
    users,
    selectedUsers,
  ])

  const searchInvalid = !search
    ? false
    : mode !== 'performance'
      ? false
      : column === 'email'
        ? false
        : column === 'id'
          ? !search.match(UUIDV4_LEFT_PREFIX_REGEX)
          : !search.match(PHONE_NUMBER_LEFT_PREFIX_REGEX)

  return (
    <>
      <div className="h-full flex flex-col">
        <FormHeader className="py-4 px-6 !mb-0" title="Users" />
        <div className="bg-surface-200 py-3 px-4 md:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-t">
          {selectedUsers.size > 0 ? (
            <div className="flex items-center gap-x-2">
              <Button type="default" icon={<Trash />} onClick={() => setShowDeleteModal(true)}>
                Delete {selectedUsers.size} users
              </Button>
              <ButtonTooltip
                type="default"
                icon={<X />}
                className="px-1.5"
                onClick={() => setSelectedUsers(new Set([]))}
                tooltip={{ content: { side: 'bottom', text: 'Cancel selection' } }}
              />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Select_Shadcn_
                  value={mode}
                  onValueChange={(v) => {
                    setMode(v as typeof mode)
                  }}
                >
                  <SelectTrigger_Shadcn_
                    size="tiny"
                    className={cn(
                      'w-[140px] border-none !bg-transparent',
                      mode === 'performance' ? 'text-brand' : 'text-warning'
                    )}
                  >
                    {mode === 'performance' ? (
                      <>
                        <Zap className="size-4" /> Optimized
                      </>
                    ) : (
                      <>
                        <LoaderPinwheel className="size-4" /> Freeform
                      </>
                    )}
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    <SelectGroup_Shadcn_>
                      <SelectItem_Shadcn_ value="performance">
                        <div className="py-2 flex flex-col gap-2 max-w-[200px]">
                          <div className="flex flex-row items-center gap-2 text-xs text-brand">
                            <Zap className="size-4" /> Optimized search
                          </div>
                          <p className="prose text-xs">
                            Uses fast and light prefix search, ideal for most day-to-day operations.
                          </p>
                        </div>
                      </SelectItem_Shadcn_>
                      <SelectItem_Shadcn_ value="freeform">
                        <div className="py-2 flex flex-col gap-2 max-w-[200px]">
                          <div className="flex flex-row items-center gap-2 text-xs text-warning">
                            <LoaderPinwheel className="size-4" /> Freeform search
                          </div>
                          <p className="prose text-xs">
                            Uses full-table scans accross mutliple columns. Can be very heavy on
                            your database if the table has a large number of rows.{' '}
                            <span className="text-warning">Use with caution!</span>
                          </p>
                        </div>
                      </SelectItem_Shadcn_>
                    </SelectGroup_Shadcn_>
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>

                <Input
                  size="tiny"
                  className={cn(
                    'w-52 pl-7 bg-transparent',
                    searchInvalid ? 'text-red-900 dark:border-red-900' : ''
                  )}
                  iconContainerClassName="pl-2"
                  icon={
                    <Search
                      size={14}
                      className={cn('text-foreground-lighter', searchInvalid ? 'text-red-900' : '')}
                    />
                  }
                  placeholder={
                    mode === 'performance'
                      ? `${column === 'id' ? 'User ID' : column === 'email' ? 'Email' : 'Phone'} or prefix...`
                      : 'Search email, phone, name, user ID'
                  }
                  value={search}
                  onChange={(e) => {
                    const value =
                      mode === 'performance'
                        ? e.target.value.replace(/\s+/g, '').toLowerCase()
                        : e.target.value.trimStart()
                    setSearch(value)
                  }}
                  onKeyDown={(e) => {
                    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
                      setSearch((s) => {
                        if (
                          s &&
                          mode === 'performance' &&
                          column === 'phone' &&
                          !s.startsWith('+')
                        ) {
                          return `+${s}`
                        }

                        return s
                      })

                      if (!searchInvalid) {
                        setFilterKeywords(search.trim().toLocaleLowerCase())
                      }
                    }
                  }}
                  actions={[
                    search && (
                      <Button
                        size="tiny"
                        type="text"
                        icon={<X className={cn(searchInvalid ? 'text-red-900' : '')} />}
                        onClick={() => clearSearch()}
                        className="p-0 h-5 w-5"
                      />
                    ),
                  ]}
                />

                {mode === 'performance' && (
                  <Select_Shadcn_
                    value={column}
                    onValueChange={(v) => {
                      setColumn(v as typeof column)
                    }}
                  >
                    <SelectTrigger_Shadcn_ size="tiny" className={cn('w-[140px] !bg-transparent')}>
                      <SelectValue_Shadcn_ />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        <SelectItem_Shadcn_ value="id" className="text-xs">
                          User ID
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="email" className="text-xs">
                          Email address
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="phone" className="text-xs">
                          Phone number
                        </SelectItem_Shadcn_>
                      </SelectGroup_Shadcn_>
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                )}

                {showUserTypeFilter && mode !== 'performance' && (
                  <Select_Shadcn_ value={filter} onValueChange={(val) => setFilter(val as Filter)}>
                    <SelectContent_Shadcn_>
                      <SelectTrigger_Shadcn_
                        size="tiny"
                        className={cn(
                          'w-[140px] !bg-transparent',
                          filter === 'all' && 'border-dashed'
                        )}
                      >
                        <SelectValue_Shadcn_ />
                      </SelectTrigger_Shadcn_>
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
                )}

                {showProviderFilter && mode !== 'performance' && (
                  <FilterPopover
                    name="Provider"
                    options={PROVIDER_FILTER_OPTIONS}
                    labelKey="name"
                    valueKey="value"
                    iconKey="icon"
                    activeOptions={selectedProviders}
                    labelClass="text-xs"
                    maxHeightClass="h-[190px]"
                    className="w-52"
                    onSaveFilters={setSelectedProviders}
                  />
                )}

                <div className="border-r border-strong h-6" />

                <FilterPopover
                  name={selectedColumns.length === 0 ? 'All columns' : 'Columns'}
                  title="Select columns to show"
                  buttonType={selectedColumns.length === 0 ? 'dashed' : 'default'}
                  options={userTableColumns.slice(1)} // Ignore user image column
                  labelKey="name"
                  valueKey="id"
                  labelClass="text-xs"
                  maxHeightClass="h-[190px]"
                  clearButtonText="Reset"
                  activeOptions={selectedColumns}
                  onSaveFilters={(value) => {
                    // When adding back hidden columns:
                    // (1) width set to default value if any
                    // (2) they will just get appended to the end
                    // (3) If "clearing", reset order of the columns to original

                    let updatedConfig = (columnConfiguration ?? []).slice()
                    if (value.length === 0) {
                      updatedConfig = userTableColumns.map((c) => ({ id: c.id, width: c.width }))
                    } else {
                      value.forEach((col) => {
                        const hasExisting = updatedConfig.find((c) => c.id === col)
                        if (!hasExisting)
                          updatedConfig.push({
                            id: col,
                            width: userTableColumns.find((c) => c.id === col)?.width,
                          })
                      })
                    }

                    const updatedColumns = formatUserColumns({
                      columns: userTableColumns,
                      config: updatedConfig,
                      users: users ?? [],
                      visibleColumns: value,
                      setSortByValue,
                      onSelectDeleteUser: setSelectedUserToDelete,
                    })

                    setSelectedColumns(value)
                    setColumns(updatedColumns)
                    saveColumnConfiguration('toggle', { columns: updatedColumns })
                  }}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === 'performance'}>
                    <Button
                      icon={
                        mode === 'performance' ? (
                          <ArrowDownNarrowWide />
                        ) : sortOrder === 'desc' ? (
                          <ArrowDownWideNarrow />
                        ) : (
                          <ArrowDownNarrowWide />
                        )
                      }
                    >
                      Sorted by{' '}
                      {mode === 'performance'
                        ? column === 'id'
                          ? 'user ID'
                          : column
                        : sortColumn === 'id'
                          ? 'user ID'
                          : sortColumn.replaceAll('_', ' ')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-44" align="start">
                    <DropdownMenuRadioGroup value={sortByValue} onValueChange={setSortByValue}>
                      <DropdownMenuSub>
                        <DropdownMenuRadioItem value="id:asc">User ID</DropdownMenuRadioItem>
                        <DropdownMenuSubTrigger>Sort by created at</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioItem value="created_at:asc">
                            Ascending
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="created_at:desc">
                            Descending
                          </DropdownMenuRadioItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Sort by last sign in at</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioItem value="last_sign_in_at:asc">
                            Ascending
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="last_sign_in_at:desc">
                            Descending
                          </DropdownMenuRadioItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      {showSortByEmail && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Sort by email</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioItem value="email:asc">
                              Ascending
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="email:desc">
                              Descending
                            </DropdownMenuRadioItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}
                      {showSortByPhone && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Sort by phone</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioItem value="phone:asc">
                              Ascending
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="phone:desc">
                              Descending
                            </DropdownMenuRadioItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-x-2">
                {isNewAPIDocsEnabled && <APIDocsButton section={['user-management']} />}
                <Button
                  size="tiny"
                  icon={<RefreshCw />}
                  type="default"
                  loading={isRefetching && !isFetchingNextPage}
                  onClick={() => {
                    refetch()
                  }}
                >
                  Refresh
                </Button>
                <AddUserDropdown />
              </div>
            </>
          )}
        </div>
        <LoadingLine loading={isLoading || isRefetching || isFetchingNextPage} />
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
                rowClass={(row) => {
                  const isSelected = row.id === selectedUser
                  return [
                    `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200'} cursor-pointer`,
                    '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
                    '[&>.rdg-cell:first-child>div]:ml-4',
                  ].join(' ')
                }}
                rowKeyGetter={(row) => row.id}
                selectedRows={selectedUsers}
                onScroll={handleScroll}
                onSelectedRowsChange={(rows) => {
                  if (rows.size > MAX_BULK_DELETE) {
                    toast(`Only up to ${MAX_BULK_DELETE} users can be selected at a time`)
                  } else setSelectedUsers(rows)
                }}
                onColumnResize={(idx, width) => saveColumnConfiguration('resize', { idx, width })}
                onColumnsReorder={(source, target) => {
                  const sourceIdx = columns.findIndex((col) => col.key === source)
                  const targetIdx = columns.findIndex((col) => col.key === target)

                  const updatedColumns = swapColumns(columns, sourceIdx, targetIdx)
                  setColumns(updatedColumns)

                  saveColumnConfiguration('reorder', { columns: updatedColumns })
                }}
                renderers={{
                  renderRow(id, props) {
                    return (
                      <Row
                        {...props}
                        onClick={() => {
                          const user = users.find((u) => u.id === id)
                          if (user) {
                            const idx = users.indexOf(user)
                            if (props.row.id) {
                              setSelectedUser(props.row.id)
                              gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
                            }
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
          {selectedUser !== undefined && (
            <UserPanel
              selectedUser={users.find((u) => u.id === selectedUser)}
              onClose={() => setSelectedUser(undefined)}
            />
          )}
        </ResizablePanelGroup>
      </div>

      <ConfirmationModal
        visible={showDeleteModal}
        variant="destructive"
        title={`Confirm to delete ${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''}`}
        loading={isDeletingUsers}
        confirmLabel="Delete"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => handleDeleteUsers()}
        alert={{
          title: `Deleting ${selectedUsers.size === 1 ? 'a user' : 'users'} is irreversible`,
          description: `This will remove the selected ${selectedUsers.size === 1 ? '' : `${selectedUsers.size} `}user${selectedUsers.size > 1 ? 's' : ''} from the project and all associated data.`,
        }}
      >
        <p className="text-sm text-foreground-light">
          This is permanent! Are you sure you want to delete the{' '}
          {selectedUsers.size === 1 ? '' : `selected ${selectedUsers.size} `}user
          {selectedUsers.size > 1 ? 's' : ''}
          {selectedUsers.size === 1 ? (
            <span className="text-foreground">
              {' '}
              {selectedUserFromCheckbox?.email ?? selectedUserFromCheckbox?.phone ?? 'this user'}
            </span>
          ) : null}
          ?
        </p>
      </ConfirmationModal>

      {/* [Joshen] For deleting via context menu, the dialog above is dependent on the selectedUsers state */}
      <DeleteUserModal
        visible={!!selectedUserToDelete}
        selectedUser={selectedUserToDelete}
        onClose={() => {
          setSelectedUserToDelete(undefined)
          cleanPointerEventsNoneOnBody()
        }}
        onDeleteSuccess={() => {
          if (selectedUserToDelete?.id === selectedUser) setSelectedUser(undefined)
          setSelectedUserToDelete(undefined)
          cleanPointerEventsNoneOnBody(500)
        }}
      />

      <ConfirmationModal
        variant="warning"
        visible={showFetchExactCountModal}
        title="Fetch exact user count"
        confirmLabel="Fetch exact count"
        onCancel={() => setShowFetchExactCountModal(false)}
        onConfirm={() => {
          setForceExactCount(true)
          setShowFetchExactCountModal(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          Your project has more than {THRESHOLD_COUNT.toLocaleString()} users, and fetching the
          exact count may cause performance issues on your database.
        </p>
      </ConfirmationModal>
    </>
  )
}
