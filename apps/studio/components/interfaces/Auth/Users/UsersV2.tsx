import pgMeta from '@supabase/pg-meta'
import type { OptimizedSearchColumns } from '@supabase/pg-meta/src/sql/studio/get-users-types'
import { keepPreviousData, useQueryClient } from '@tanstack/react-query'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { APIDocsButton } from 'components/ui/APIDocsButton'
import { AlertError } from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FilterPopover } from 'components/ui/FilterPopover'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { InlineLink } from 'components/ui/InlineLink'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useIndexWorkerStatusQuery } from 'data/auth/index-worker-status-query'
import { authKeys } from 'data/auth/keys'
import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { useUserIndexStatusesQuery } from 'data/auth/user-search-indexes-query'
import { useUsersCountQuery } from 'data/auth/users-count-query'
import { User, useUsersInfiniteQuery } from 'data/auth/users-infinite-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { cleanPointerEventsNoneOnBody, isAtBottom } from 'lib/helpers'
import {
  ExternalLinkIcon,
  InfoIcon,
  RefreshCw,
  Trash,
  Users,
  WandSparklesIcon,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { parseAsArrayOf, parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'
import { UIEvent, useEffect, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'
import { toast } from 'sonner'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  LoadingLine,
  ResizablePanel,
  ResizablePanelGroup,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AddUserDropdown } from './AddUserDropdown'
import { DeleteUserModal } from './DeleteUserModal'
import { SortDropdown } from './SortDropdown'
import { UserPanel } from './UserPanel'
import type { SpecificFilterColumn } from './Users.constants'
import {
  ColumnConfiguration,
  Filter,
  MAX_BULK_DELETE,
  PROVIDER_FILTER_OPTIONS,
  USERS_TABLE_COLUMNS,
} from './Users.constants'
import { formatUserColumns, formatUsersData } from './Users.utils'
import { UsersFooter } from './UsersFooter'
import { UsersSearch } from './UsersSearch'

const SORT_BY_VALUE_COUNT_THRESHOLD = 10_000
const IMPROVED_SEARCH_COUNT_THRESHOLD = 10_000

const INDEX_WORKER_LOGS_SEARCH_STRING = `select id, auth_logs.timestamp, metadata.level, event_message, metadata.msg as msg, metadata.error
from auth_logs
cross join unnest(metadata) as metadata
where metadata.worker_type = 'apiworker_index_worker'
  and auth_logs.timestamp >= timestamp_sub(current_timestamp(), interval 3 hour)
order by timestamp desc
limit 100`

export const UsersV2 = () => {
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const gridRef = useRef<DataGridHandle>(null)
  const xScroll = useRef<number>(0)
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()
  const { mutate: sendEvent } = useSendEventMutation()

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

  const [specificFilterColumn, setSpecificFilterColumn] = useQueryState<SpecificFilterColumn>(
    'filter',
    parseAsStringEnum<SpecificFilterColumn>([
      'id',
      'email',
      'phone',
      'name',
      'freeform',
    ]).withDefault('email')
  )
  const [filterUserType, setFilterUserType] = useQueryState(
    'userType',
    parseAsStringEnum(['all', 'verified', 'unverified', 'anonymous']).withDefault('all')
  )
  const [filterKeywords] = useQueryState('keywords', { defaultValue: '' })
  const [sortByValue, setSortByValue] = useQueryState('sortBy', { defaultValue: 'created_at:desc' })
  const [sortColumn, sortOrder] = sortByValue.split(':')
  const [selectedColumns, setSelectedColumns] = useQueryState(
    'columns',
    parseAsArrayOf(parseAsString, ',').withDefault([])
  )
  const [selectedProviders, setSelectedProviders] = useQueryState(
    'providers',
    parseAsArrayOf(parseAsString, ',').withDefault([])
  )
  const [selectedId, setSelectedId] = useQueryState(
    'show',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )

  const [improvedSearchDismissed, setImprovedSearchDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.AUTH_USERS_IMPROVED_SEARCH_DISMISSED(projectRef ?? ''),
    false
  )

  // [Joshen] Opting to store filter column, into local storage for now, which will initialize
  // the page when landing on auth users page only if no query params for filter column provided
  const [localStorageFilter, setLocalStorageFilter, { isSuccess: isLocalStorageFilterLoaded }] =
    useLocalStorageQuery<SpecificFilterColumn>(
      LOCAL_STORAGE_KEYS.AUTH_USERS_FILTER(projectRef ?? ''),
      'email'
    )

  const [
    localStorageSortByValue,
    setLocalStorageSortByValue,
    { isSuccess: isLocalStorageSortByValueLoaded },
  ] = useLocalStorageQuery<string>(
    LOCAL_STORAGE_KEYS.AUTH_USERS_SORT_BY_VALUE(projectRef ?? ''),
    'id'
  )

  const [
    columnConfiguration,
    setColumnConfiguration,
    { isSuccess: isSuccessStorage, isError: isErrorStorage, error: errorStorage },
  ] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.AUTH_USERS_COLUMNS_CONFIGURATION(projectRef ?? ''),
    null as ColumnConfiguration[] | null
  )

  const [columns, setColumns] = useState<Column<any>[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<any>>(new Set([]))
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<User>()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeletingUsers, setIsDeletingUsers] = useState(false)
  const [showFreeformWarning, setShowFreeformWarning] = useState(false)
  const [showCreateIndexesModal, setShowCreateIndexesModal] = useState(false)

  const { data: totalUsersCountData, isSuccess: isCountLoaded } = useUsersCountQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      // [Joshen] Do not change the following, these are to match the count query in UsersFooter
      // on initial load with no search configuration so that we only fire 1 count request at the
      // beginning. The count value is for all users - should disregard any search configuration
      keywords: '',
      filter: undefined,
      providers: [],
      forceExactCount: false,
    },
    { placeholderData: keepPreviousData }
  )
  const totalUsers = totalUsersCountData?.count ?? 0
  const isCountWithinThresholdForSortBy = totalUsers <= SORT_BY_VALUE_COUNT_THRESHOLD

  const isImprovedUserSearchFlagEnabled = useFlag('improvedUserSearch')
  const { data: authConfig, isLoading: isAuthConfigLoading } = useAuthConfigQuery({ projectRef })
  const {
    data: userSearchIndexes,
    isError: isUserSearchIndexesError,
    isLoading: isUserSearchIndexesLoading,
  } = useUserIndexStatusesQuery({ projectRef, connectionString: project?.connectionString })
  const { data: indexWorkerStatus, isLoading: isIndexWorkerStatusLoading } =
    useIndexWorkerStatusQuery({
      projectRef,
      connectionString: project?.connectionString,
    })
  const { mutate: updateAuthConfig, isPending: isUpdatingAuthConfig } = useAuthConfigUpdateMutation(
    {
      onSuccess: () => {
        toast.success('Initiated creation of user search indexes')
      },
      onError: (error) => {
        toast.error(`Failed to initiate creation of user search indexes: ${error?.message}`)
      },
    }
  )

  const handleEnableUserSearchIndexes = () => {
    if (!projectRef) return console.error('Project ref is required')
    updateAuthConfig({
      projectRef: projectRef,
      config: { INDEX_WORKER_ENSURE_USER_SEARCH_INDEXES_EXIST: true },
    })
  }

  const userSearchIndexesAreValidAndReady =
    !isUserSearchIndexesError &&
    !isUserSearchIndexesLoading &&
    userSearchIndexes?.length === pgMeta.USER_SEARCH_INDEXES.length &&
    userSearchIndexes?.every((index) => index.is_valid && index.is_ready)

  /**
   * We want to show the improved search when:
   * 1. The feature flag is enabled for them
   * 2. The user has opted in (authConfig.INDEX_WORKER_ENSURE_USER_SEARCH_INDEXES_EXIST is true)
   * 3. The required indexes are valid and ready
   */
  const improvedSearchEnabled =
    isImprovedUserSearchFlagEnabled &&
    authConfig?.INDEX_WORKER_ENSURE_USER_SEARCH_INDEXES_EXIST === true &&
    userSearchIndexesAreValidAndReady

  /**
   * We want to show users the improved search opt-in only if:
   * 1. The feature flag is enabled for them
   * 2. They have not opted in yet (authConfig.INDEX_WORKER_ENSURE_USER_SEARCH_INDEXES_EXIST is false)
   * 3. They have < threshold number of users
   * 4. They have not dismissed the alert
   */
  const isCountWithinThresholdForOptIn =
    isCountLoaded && totalUsers <= IMPROVED_SEARCH_COUNT_THRESHOLD
  const showImprovedSearchOptIn =
    isImprovedUserSearchFlagEnabled &&
    authConfig?.INDEX_WORKER_ENSURE_USER_SEARCH_INDEXES_EXIST === false &&
    isCountWithinThresholdForOptIn &&
    !improvedSearchDismissed

  /**
   * We want to show an "in progress" state when:
   * 1. The user has opted in (authConfig.INDEX_WORKER_ENSURE_USER_SEARCH_INDEXES_EXIST is true)
   * 2. The index worker is currently in progress
   */
  const indexWorkerInProgress =
    authConfig?.INDEX_WORKER_ENSURE_USER_SEARCH_INDEXES_EXIST === true &&
    indexWorkerStatus?.is_in_progress === true

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
      filter:
        (specificFilterColumn !== 'freeform' && !improvedSearchEnabled) || filterUserType === 'all'
          ? undefined
          : filterUserType,
      providers: selectedProviders,
      sort: sortColumn as 'id' | 'created_at' | 'email' | 'phone',
      order: sortOrder as 'asc' | 'desc',
      // improved search will always have a column specified
      ...(specificFilterColumn !== 'freeform' || improvedSearchEnabled
        ? { column: specificFilterColumn as OptimizedSearchColumns }
        : { column: undefined }),

      improvedSearchEnabled: improvedSearchEnabled,
    },
    {
      placeholderData: Boolean(filterKeywords) ? keepPreviousData : undefined,
      // [Joshen] This is to prevent the dashboard from invalidating when refocusing as it may create
      // a barrage of requests to invalidate each page esp when the project has many many users.
      staleTime: Infinity,
      // NOTE(iat): query the user data only after we know whether to show improved search or not
      enabled: !isUserSearchIndexesLoading && !isAuthConfigLoading && !isIndexWorkerStatusLoading,
    }
  )

  const { mutateAsync: deleteUser } = useUserDeleteMutation()

  const users = useMemo(() => data?.pages.flatMap((page) => page.result) ?? [], [data?.pages])
  const selectedUser = users?.find((u) => u.id === selectedId)?.id

  // [Joshen] Only relevant for when selecting one user only
  const selectedUserFromCheckbox = users.find((u) => u.id === [...selectedUsers][0])

  const telemetryProps = {
    sort_column: sortColumn,
    sort_order: sortOrder,
    providers: selectedProviders,
    user_type: filterUserType === 'all' ? undefined : filterUserType,
    keywords: filterKeywords,
    filter_column: specificFilterColumn === 'freeform' ? undefined : specificFilterColumn,
  }
  const telemetryGroups = {
    project: projectRef ?? 'Unknown',
    organization: selectedOrg?.slug ?? 'Unknown',
  }

  const updateStorageFilter = (value: SpecificFilterColumn) => {
    setLocalStorageFilter(value)
    setSpecificFilterColumn(value)
    if (value !== 'freeform' && !improvedSearchEnabled) {
      updateSortByValue('id:asc')
    }
  }

  const updateSortByValue = (value: string) => {
    if (isCountWithinThresholdForSortBy) setLocalStorageSortByValue(value)
    setSortByValue(value)
  }

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
        queryClient.invalidateQueries({ queryKey: authKeys.usersInfinite(projectRef) }),
      ])
      toast.success(
        `Successfully deleted the selected ${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''}`
      )
      setShowDeleteModal(false)
      setSelectedUsers(new Set([]))

      if (userIds.includes(selectedUser)) setSelectedId(null)
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
        specificFilterColumn,
        columns: userTableColumns,
        config: columnConfiguration ?? [],
        users: users ?? [],
        visibleColumns: selectedColumns,
        setSortByValue: updateSortByValue,
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
    specificFilterColumn,
  ])

  // [Joshen] Load URL state for filter column and sort by only once, if no respective values found in URL params
  useEffect(() => {
    if (
      isLocalStorageFilterLoaded &&
      isLocalStorageSortByValueLoaded &&
      isCountLoaded &&
      isCountWithinThresholdForSortBy
    ) {
      if (specificFilterColumn === 'email' && localStorageFilter !== 'email') {
        setSpecificFilterColumn(localStorageFilter)
      }
      if (sortByValue === 'id:asc' && localStorageSortByValue !== 'id:asc') {
        setSortByValue(localStorageSortByValue)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocalStorageFilterLoaded, isLocalStorageSortByValueLoaded, isCountLoaded])

  return (
    <>
      <div className="h-full flex flex-col">
        <FormHeader className="py-4 px-6 !mb-0" title="Users" />

        {showImprovedSearchOptIn && (
          <Alert_Shadcn_ className="rounded-none mb-0 border-0 border-t relative">
            <Tooltip>
              <TooltipTrigger
                onClick={() => setImprovedSearchDismissed(true)}
                className="absolute top-3 right-3 opacity-30 hover:opacity-100 transition-opacity"
              >
                <X size={14} className="text-foreground-light" />
              </TooltipTrigger>
              <TooltipContent side="bottom">Dismiss</TooltipContent>
            </Tooltip>
            <InfoIcon className="size-4" />
            <AlertTitle_Shadcn_>Upgrade to an improved search experience</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="flex justify-between items-center">
              <div>
                Enable faster and more reliable searching, sorting, and filtering of your users.
              </div>
              <Button
                icon={<WandSparklesIcon />}
                onClick={() => setShowCreateIndexesModal(true)}
                loading={isUpdatingAuthConfig}
                type="default"
              >
                Upgrade search
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}

        {indexWorkerInProgress && (
          <Alert_Shadcn_ className="rounded-none mb-0 border-0 border-t">
            <InfoIcon className="size-4" />
            <AlertTitle_Shadcn_>Index creation is in progress</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="flex justify-between items-center">
              <div>
                The indexes are currently being created. This process may take some time depending
                on the number of users in your project.
              </div>

              <Button type="link" iconRight={<ExternalLinkIcon />} asChild>
                <Link
                  href={`/project/${projectRef}/logs/explorer?q=${encodeURI(INDEX_WORKER_LOGS_SEARCH_STRING)}`}
                  target="_blank"
                >
                  View logs
                </Link>
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}

        <div className="bg-surface-200 py-3 px-4 md:px-6 flex flex-col lg:flex-row lg:items-start justify-between gap-2 border-t">
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
                <UsersSearch
                  improvedSearchEnabled={improvedSearchEnabled}
                  telemetryProps={telemetryProps}
                  telemetryGroups={telemetryGroups}
                  onSelectFilterColumn={(value) => {
                    if (value === 'freeform') {
                      if (isCountWithinThresholdForSortBy) {
                        updateStorageFilter(value)
                      } else {
                        setShowFreeformWarning(true)
                      }
                    } else {
                      updateStorageFilter(value)
                    }
                  }}
                />

                {showUserTypeFilter &&
                  (specificFilterColumn === 'freeform' || improvedSearchEnabled) && (
                    <Select_Shadcn_
                      value={filterUserType}
                      onValueChange={(val) => {
                        setFilterUserType(val as Filter)
                        sendEvent({
                          action: 'auth_users_search_submitted',
                          properties: {
                            trigger: 'user_type_filter',
                            ...telemetryProps,
                            user_type: val,
                          },
                          groups: telemetryGroups,
                        })
                      }}
                    >
                      <SelectTrigger_Shadcn_
                        size="tiny"
                        className={cn(
                          'w-[140px] !bg-transparent',
                          filterUserType === 'all' && 'border-dashed'
                        )}
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
                  )}

                {showProviderFilter &&
                  (specificFilterColumn === 'freeform' || improvedSearchEnabled) && (
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
                      onSaveFilters={(providers) => {
                        setSelectedProviders(providers)
                        sendEvent({
                          action: 'auth_users_search_submitted',
                          properties: {
                            trigger: 'provider_filter',
                            ...telemetryProps,
                            providers,
                          },
                          groups: telemetryGroups,
                        })
                      }}
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
                      specificFilterColumn,
                      columns: userTableColumns,
                      config: updatedConfig,
                      users: users ?? [],
                      visibleColumns: value,
                      setSortByValue: updateSortByValue,
                      onSelectDeleteUser: setSelectedUserToDelete,
                    })

                    setSelectedColumns(value)
                    setColumns(updatedColumns)
                    saveColumnConfiguration('toggle', { columns: updatedColumns })
                  }}
                />

                <SortDropdown
                  specificFilterColumn={specificFilterColumn}
                  sortColumn={sortColumn}
                  sortOrder={sortOrder}
                  sortByValue={sortByValue}
                  setSortByValue={(value) => {
                    const [sortColumn, sortOrder] = value.split(':')
                    updateSortByValue(value)
                    sendEvent({
                      action: 'auth_users_search_submitted',
                      properties: {
                        trigger: 'sort_change',
                        ...telemetryProps,
                        sort_column: sortColumn,
                        sort_order: sortOrder,
                      },
                      groups: telemetryGroups,
                    })
                  }}
                  showSortByEmail={showSortByEmail}
                  showSortByPhone={showSortByPhone}
                  improvedSearchEnabled={improvedSearchEnabled}
                />
              </div>

              <div className="flex items-center gap-x-2">
                {isNewAPIDocsEnabled && (
                  <APIDocsButton section={['user-management']} source="auth-users" />
                )}
                <ButtonTooltip
                  size="tiny"
                  icon={<RefreshCw />}
                  type="default"
                  className="w-7"
                  loading={isRefetching && !isFetchingNextPage}
                  onClick={() => {
                    refetch()
                    sendEvent({
                      action: 'auth_users_search_submitted',
                      properties: {
                        trigger: 'refresh_button',
                        ...telemetryProps,
                      },
                      groups: telemetryGroups,
                    })
                  }}
                  tooltip={{ content: { side: 'bottom', text: 'Refresh' } }}
                />
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
                              setSelectedId(props.row.id)
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
                          {filterUserType !== 'all' || filterKeywords.length > 0
                            ? 'No users found'
                            : 'No users in your project'}
                        </p>
                        <p className="text-foreground-light">
                          {filterUserType !== 'all' || filterKeywords.length > 0
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
          {!!selectedId && <UserPanel />}
        </ResizablePanelGroup>

        <UsersFooter
          filter={filterUserType}
          filterKeywords={filterKeywords}
          selectedProviders={selectedProviders}
          specificFilterColumn={specificFilterColumn}
        />
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

      <ConfirmationModal
        size="medium"
        variant="warning"
        visible={showFreeformWarning}
        confirmLabel="Confirm"
        title="Confirm to search across all columns"
        onConfirm={() => {
          updateStorageFilter('freeform')
          setShowFreeformWarning(false)
        }}
        onCancel={() => setShowFreeformWarning(false)}
        alert={{
          base: { variant: 'warning' },
          title: 'Searching across all columns is not recommended with many users',
          description:
            'This may adversely impact your database, in particular if your project has a large number of users - use with caution. Search mode will not be persisted across browser sessions as a safeguard.',
        }}
      >
        <p className="text-foreground-light text-sm">
          This will allow you to search across user ID, email, phone number, and display name
          through a single input field. You will also be able to filter users by provider and sort
          on users across different columns.
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        size="medium"
        visible={showCreateIndexesModal}
        confirmLabel="Upgrade search"
        title="Upgrade to improved search"
        onConfirm={() => {
          handleEnableUserSearchIndexes()
          setShowCreateIndexesModal(false)
        }}
        onCancel={() => setShowCreateIndexesModal(false)}
        alert={{
          title: 'Improved search experience',
          description:
            'This will create indexes to enable faster and more reliable searching, sorting, and filtering of your users.',
        }}
      >
        <ul className="text-sm list-disc pl-4 my-3 flex flex-col gap-2">
          <li className="marker:text-foreground-light">
            Creating these indexes may temporarily impact database performance.
          </li>
          <li className="marker:text-foreground-light">
            Depending on the number of users, this may take some time to complete.
          </li>
          <li className="marker:text-foreground-light">
            You can continue using the Auth Users page while the indexes are being created, but
            improvements will only take effect once complete.
          </li>
          <li className="marker:text-foreground-light">
            You can monitor the progress in the{' '}
            <InlineLink
              href={`/project/${projectRef}/logs/explorer?q=${encodeURI(INDEX_WORKER_LOGS_SEARCH_STRING)}`}
              target="_blank"
            >
              project logs
            </InlineLink>
            . If you encounter any issues, please contact Supabase support for assistance.
          </li>
        </ul>
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
          if (selectedUserToDelete?.id === selectedUser) setSelectedId(null)
          setSelectedUserToDelete(undefined)
          cleanPointerEventsNoneOnBody(500)
        }}
      />
    </>
  )
}
