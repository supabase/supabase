import { useQueryClient } from '@tanstack/react-query'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { ArrowDown, ArrowUp, Loader2, RefreshCw, Search, Trash, Users, X } from 'lucide-react'
import { UIEvent, useEffect, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import APIDocsButton from 'components/ui/APIDocsButton'
import { FilterPopover } from 'components/ui/FilterPopover'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { authKeys } from 'data/auth/keys'
import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { useUsersCountQuery } from 'data/auth/users-count-query'
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
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import AddUserDropdown from './AddUserDropdown'
import { UserPanel } from './UserPanel'
import { MAX_BULK_DELETE, PROVIDER_FILTER_OPTIONS } from './Users.constants'
import { formatUserColumns, formatUsersData, isAtBottom } from './Users.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

export type Filter = 'all' | 'verified' | 'unverified' | 'anonymous'
export type UsersTableColumn = {
  id: string
  name: string
  minWidth?: number
  width?: number
  resizable?: boolean
}
export type ColumnConfiguration = { id: string; width?: number }
export const USERS_TABLE_COLUMNS: UsersTableColumn[] = [
  { id: 'img', name: '', minWidth: 95, width: 95, resizable: false },
  { id: 'id', name: 'UID', width: 280 },
  { id: 'name', name: 'Display name', minWidth: 0, width: 150 },
  { id: 'email', name: 'Email', width: 300 },
  { id: 'phone', name: 'Phone' },
  { id: 'providers', name: 'Providers', minWidth: 150 },
  { id: 'provider_type', name: 'Provider type', minWidth: 150 },
  { id: 'created_at', name: 'Created at', width: 260 },
  { id: 'last_sign_in_at', name: 'Last sign in at', width: 260 },
]

// [Joshen] Just naming it as V2 as its a rewrite of the old one, to make it easier for reviews
// Can change it to remove V2 thereafter
export const UsersV2 = () => {
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const gridRef = useRef<DataGridHandle>(null)
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()

  const [columns, setColumns] = useState<Column<any>[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [filterKeywords, setFilterKeywords] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Set<any>>(new Set([]))
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<string>()
  const [sortByValue, setSortByValue] = useState<string>('created_at:desc')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeletingUsers, setIsDeletingUsers] = useState(false)
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
    fetchNextPage,
  } = useUsersInfiniteQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
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

  const { data: countData } = useUsersCountQuery({
    projectRef,
    connectionString: project?.connectionString,
    keywords: filterKeywords,
    filter: filter === 'all' ? undefined : filter,
    providers: selectedProviders,
  })

  const { mutateAsync: deleteUser } = useUserDeleteMutation()

  const totalUsers = countData ?? 0
  const users = useMemo(() => data?.pages.flatMap((page) => page.result) ?? [], [data?.pages])
  // [Joshen] Only relevant for when selecting one user only
  const selectedUserToDelete = users.find((u) => u.id === [...selectedUsers][0])

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
      await Promise.all([
        queryClient.invalidateQueries(authKeys.usersInfinite(projectRef)),
        queryClient.invalidateQueries(authKeys.usersCount(projectRef)),
      ])
      toast.success(
        `Successfully deleted the selected ${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''}`
      )
      setShowDeleteModal(false)
      setSelectedUsers(new Set([]))

      if (userIds.includes(selectedUser)) setSelectedUser(undefined)
    } catch (error: any) {
      toast.error(`Failed to delete selected users: ${error.message}`)
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
        config: columnConfiguration ?? [],
        users: users ?? [],
        visibleColumns: selectedColumns,
        setSortByValue,
      })
      setColumns(columns)
      if (columns.length < USERS_TABLE_COLUMNS.length) {
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

  return (
    <>
      <div className="h-full flex flex-col">
        <FormHeader className="py-4 px-6 !mb-0" title="Users" />
        <div className="bg-surface-200 py-3 px-6 flex items-center justify-between border-t">
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
              <div className="flex items-center gap-x-2">
                <Input
                  size="tiny"
                  className="w-52 pl-7 bg-transparent"
                  iconContainerClassName="pl-2"
                  icon={<Search size={14} className="text-foreground-lighter" />}
                  placeholder="Search email, phone or UID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.code === 'Enter') {
                      setSearch(search.trim())
                      setFilterKeywords(search.trim().toLocaleLowerCase())
                    }
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

                <FilterPopover
                  name={selectedColumns.length === 0 ? 'All columns' : 'Columns'}
                  title="Select columns to show"
                  buttonType={selectedColumns.length === 0 ? 'dashed' : 'default'}
                  options={USERS_TABLE_COLUMNS.slice(1)} // Ignore user image column
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
                      updatedConfig = USERS_TABLE_COLUMNS.map((c) => ({ id: c.id, width: c.width }))
                    } else {
                      value.forEach((col) => {
                        const hasExisting = updatedConfig.find((c) => c.id === col)
                        if (!hasExisting)
                          updatedConfig.push({
                            id: col,
                            width: USERS_TABLE_COLUMNS.find((c) => c.id === col)?.width,
                          })
                      })
                    }

                    const updatedColumns = formatUserColumns({
                      config: updatedConfig,
                      users: users ?? [],
                      visibleColumns: value,
                      setSortByValue,
                    })

                    setSelectedColumns(value)
                    setColumns(updatedColumns)
                    saveColumnConfiguration('toggle', { columns: updatedColumns })
                  }}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button icon={sortOrder === 'desc' ? <ArrowDown /> : <ArrowUp />}>
                      Sorted by {sortColumn.replaceAll('_', ' ')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-44" align="start">
                    <DropdownMenuRadioGroup value={sortByValue} onValueChange={setSortByValue}>
                      <DropdownMenuSub>
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
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Sort by email</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioItem value="email:asc">Ascending</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="email:desc">
                            Descending
                          </DropdownMenuRadioItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Sort by phone</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioItem value="phone:asc">Ascending</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="phone:desc">
                            Descending
                          </DropdownMenuRadioItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
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
                  onClick={() => refetch()}
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
                        key={props.row.id}
                        onClick={() => {
                          const idx = users.indexOf(users.find((u) => u.id === id) ?? {})
                          if (props.row.id) {
                            setSelectedUser(props.row.id)
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
          {selectedUser !== undefined && (
            <UserPanel
              selectedUser={users.find((u) => u.id === selectedUser)}
              onClose={() => setSelectedUser(undefined)}
            />
          )}
        </ResizablePanelGroup>

        <div className="flex justify-between min-h-9 h-9 overflow-hidden items-center px-6 w-full border-t text-xs text-foreground-light">
          {isLoading || isRefetching ? 'Loading users...' : `Total: ${totalUsers} users`}
          {(isLoading || isRefetching || isFetchingNextPage) && (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading...
            </span>
          )}
        </div>
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
              {selectedUserToDelete?.email ?? selectedUserToDelete?.phone ?? 'this user'}
            </span>
          ) : null}
          ?
        </p>
      </ConfirmationModal>
    </>
  )
}
