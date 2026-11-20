import { useQuery } from '@tanstack/react-query'
import {
  ColumnFiltersState,
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedMinMaxValues as getTTableFacetedMinMaxValues,
  getFacetedUniqueValues as getTTableFacetedUniqueValues,
  Row,
  SortingState,
  Table,
  useReactTable,
} from '@tanstack/react-table'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useFeatureFlags, useFlag, useParams } from 'common'
import {
  Layers2Icon,
  Loader2Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
} from 'lucide-react'
import { useQueryStates } from 'nuqs'
import { VisuallyHidden } from 'radix-ui'
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  ChartConfig,
  cn,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  useIsMobile,
} from 'ui'

import { RefreshButton } from '../../ui/DataTable/RefreshButton'
import { generateDynamicColumns, UNIFIED_LOGS_COLUMNS } from './components/Columns'
import { DownloadLogsButton } from './components/DownloadLogsButton'
import { LogsFilterBar } from './components/LogsFilterBar'
import { getLogAttributeSources } from './components/LogsFilterBar.utils'
import { LogsListPanel } from './components/LogsListPanel'
import { LogsTable } from './components/LogsTable'
import { isPresetViewId, PRESET_VIEWS } from './components/LogsViews.presets'
import { getFilterCombinationKey, MIN_FILTERS_TO_SAVE } from './components/LogsViews.utils'
import { LogsViewsPanel } from './components/LogsViewsPanel'
import { NewViewEntry } from './components/NewViewEntry'
import { SavedViewsEntry } from './components/SavedViewsEntry'
import { TooltipLabel } from './components/TooltipLabel'
import { ViewModifiedPopover } from './components/ViewModifiedPopover'
import { ServiceFlowPanel } from './ServiceFlowPanel'
import { LOG_TYPES, PIPELINE_LOG_LEVEL_LABELS, SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import { filterFields as defaultFilterFields } from './UnifiedLogs.fields'
import {
  buildDefaultColumnFilters,
  buildFilterSearchUpdate,
  parseLogsFilterUrlParams,
} from './UnifiedLogs.filters'
import {
  useFilterSearchSync,
  useLiveMode,
  useLogsTableColumns,
  useResetFocus,
} from './UnifiedLogs.hooks'
import { isUserFilterUnreachable } from './UnifiedLogs.queries'
import { ColumnSchema } from './UnifiedLogs.schema'
import { UnifiedLogsScope } from './UnifiedLogs.types'
import {
  gateLogTypeFilters,
  gateLogTypeOptions,
  getComputeLogsAvailability,
  getFacetedUniqueValues,
  getLogRowClassName,
  getLogTypeVisibility,
  getUniqueLogRows,
  isOfferedFilter,
  toQuerySearchParams,
} from './UnifiedLogs.utils'
import { applyView, isViewModified, serializeView, type LogsView } from './UnifiedLogs.views'
import { LOGS_SAVED_VIEWS_FLAG, useLogsViews } from './useLogsViews'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { LEVELS } from '@/components/ui/DataTable/DataTable.constants'
import { Option } from '@/components/ui/DataTable/DataTable.types'
import { arrSome, inDateRange } from '@/components/ui/DataTable/DataTable.utils'
import { DataTableFilterControlsDrawer } from '@/components/ui/DataTable/DataTableFilters/DataTableFilterControlsDrawer'
import { DataTableSideBarLayout } from '@/components/ui/DataTable/DataTableSideBarLayout'
import { DataTableViewOptions } from '@/components/ui/DataTable/DataTableViewOptions'
import { FilterSideBar } from '@/components/ui/DataTable/FilterSideBar'
import { LiveButton } from '@/components/ui/DataTable/LiveButton'
import { DataTableProvider } from '@/components/ui/DataTable/providers/DataTableProvider'
import { RowSelectionModifiers } from '@/components/ui/DataTable/rowSelection.utils'
import { TimelineChart } from '@/components/ui/DataTable/TimelineChart'
import { useTableRowSelection } from '@/components/ui/DataTable/useTableRowSelection'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { unifiedLogQueryOptions } from '@/data/logs/unified-log-query'
import { useUnifiedLogsChartQuery } from '@/data/logs/unified-logs-chart-query'
import { useUnifiedLogsCountQuery } from '@/data/logs/unified-logs-count-query'
import { useUnifiedLogsInfiniteQuery } from '@/data/logs/unified-logs-infinite-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useShowMultigresLogs } from '@/hooks/misc/useShowMultigresLogs'
import { useShowPipelinesLogs } from '@/hooks/misc/useShowPipelinesLogs'
import { useTrack } from '@/lib/telemetry/track'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const CHART_CONFIG = {
  success: {
    label: <TooltipLabel level="success" />,
    color: 'var(--chart-muted)',
  },
  warning: {
    label: <TooltipLabel level="warning" />,
    color: 'var(--chart-status-warning)',
  },
  error: {
    label: <TooltipLabel level="error" />,
    color: 'hsl(var(--destructive-default))',
  },
} satisfies ChartConfig

const PipelineLevelOption = (option: Option) => <span className="text-xs">{option.label}</span>

interface UnifiedLogsProps {
  scope?: UnifiedLogsScope
  hasFilterSideBar?: boolean
  offeredFilters?: readonly string[]
  columnPreferencesKey?: string
}

export const UnifiedLogs = ({
  scope,
  hasFilterSideBar = true,
  offeredFilters,
  columnPreferencesKey,
}: UnifiedLogsProps) => {
  useResetFocus()

  const { ref: projectRef } = useParams()
  const track = useTrack()
  const [search, setSearch] = useQueryStates(SEARCH_PARAMS_PARSER)
  const showMultigresLogs = useShowMultigresLogs()
  const { showPipelinesLogs, isLoading: isLoadingPipelinesLogs } = useShowPipelinesLogs()
  const canShowPipelinesLogs = showPipelinesLogs || isLoadingPipelinesLogs
  const { hasLoaded: flagsLoaded } = useFeatureFlags()
  const computeEnabled = useFlag('compute')
  const savedViewsFlag = useFlag(LOGS_SAVED_VIEWS_FLAG)
  const showSavedViews = IS_PLATFORM && savedViewsFlag
  const {
    views: savedViews,
    isLoading: isLoadingSavedViews,
    isError: isErrorSavedViews,
    createView: createSavedView,
    updateView: updateSavedView,
    deleteView: deleteSavedView,
    isPending: isSavingView,
    canCreate: canCreateView,
    canUpdate: canUpdateView,
    canDelete: canDeleteView,
    retry: retrySavedViews,
  } = useLogsViews()
  const isMobile = useIsMobile()
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(!isMobile)
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [isViewsSectionOpen, setIsViewsSectionOpen] = useState(false)
  const [isMobileViewsDrawerOpen, setIsMobileViewsDrawerOpen] = useState(false)
  const [saveViewProjectRef, setSaveViewProjectRef] = useState<string | null>(null)
  const isSavingNewView = saveViewProjectRef !== null && saveViewProjectRef === projectRef
  const currentProjectRef = useRef(projectRef)
  currentProjectRef.current = projectRef
  const [dismissedUpdateKey, setDismissedUpdateKey] = useState<string | null>(null)
  const [isReviewingChanges, setIsReviewingChanges] = useState(false)
  const activeViewRowRef = useRef<HTMLDivElement | null>(null)
  const [isActiveViewRowMounted, setIsActiveViewRowMounted] = useState(false)
  const sidebarActiveViewRowRef = useRef<HTMLDivElement | null>(null)
  const mobileActiveViewRowRef = useRef<HTMLDivElement | null>(null)
  const syncActiveViewRow = useCallback(() => {
    const node = sidebarActiveViewRowRef.current ?? mobileActiveViewRowRef.current
    activeViewRowRef.current = node
    setIsActiveViewRowMounted(node !== null)
  }, [])
  const setSidebarActiveViewRow = useCallback(
    (node: HTMLDivElement | null) => {
      sidebarActiveViewRowRef.current = node
      syncActiveViewRow()
    },
    [syncActiveViewRow]
  )
  const setMobileActiveViewRow = useCallback(
    (node: HTMLDivElement | null) => {
      mobileActiveViewRowRef.current = node
      syncActiveViewRow()
    },
    [syncActiveViewRow]
  )
  const computeAvailability = getComputeLogsAvailability({
    isPlatform: IS_PLATFORM,
    flagsLoaded,
    computeEnabled,
  })
  const visibleSearchFilters = gateLogTypeFilters(
    search.filter,
    getLogTypeVisibility(
      {
        multigres: showMultigresLogs,
        pipelines: canShowPipelinesLogs,
        compute: computeAvailability.preserveComputeFilter,
      },
      scope
    )
  )

  const defaultColumnSorting = search.sort ? [search.sort] : []
  const defaultColumnFilters = buildDefaultColumnFilters({
    ...search,
    filter: visibleSearchFilters,
  })

  const [topBarHeight, setTopBarHeight] = useState(0)
  const topBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const rect = topBarRef.current?.getBoundingClientRect()
      if (rect) setTopBarHeight(rect.height)
    })
    const topBar = topBarRef.current
    if (!topBar) return
    observer.observe(topBar)
    return () => observer.unobserve(topBar)
  }, [])

  const [sorting, setSorting] = useState<SortingState>(defaultColumnSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(defaultColumnFilters)
  const [localFilterOrigin, setLocalFilterOrigin] = useState<string | null>(null)

  const [dock, setDock] = useLocalStorageQuery<'bottom' | 'right'>(
    columnPreferencesKey
      ? `${LOCAL_STORAGE_KEYS.UNIFIED_LOGS_DOCK}-${columnPreferencesKey}`
      : LOCAL_STORAGE_KEYS.UNIFIED_LOGS_DOCK,
    'bottom'
  )

  const { columnVisibility, setColumnVisibility, columnOrder, setColumnOrder } =
    useLogsTableColumns(columnPreferencesKey)

  const queryLogTypeVisibility = useMemo(
    () =>
      getLogTypeVisibility(
        {
          multigres: showMultigresLogs,
          pipelines: canShowPipelinesLogs,
          compute: computeAvailability.canQueryCompute,
        },
        scope
      ),
    [showMultigresLogs, canShowPipelinesLogs, computeAvailability.canQueryCompute, scope]
  )

  const searchParameters = useMemo(() => {
    const parameters = toQuerySearchParams(search, scope)
    if (parameters.filter) {
      parameters.filter = gateLogTypeFilters(parameters.filter, queryLogTypeVisibility) ?? undefined
    }
    return parameters
  }, [search, scope, queryLogTypeVisibility])
  const urlFilterScope = JSON.stringify([searchParameters.filter, searchParameters.date])
  const parsedFilters = parseLogsFilterUrlParams(searchParameters.filter)
  const selectedLogTypes = [...parsedFilters, ...(scope?.filters ?? [])].filter(
    (filter) => filter.column === 'log_type' && filter.operator === '='
  )
  const isPipelinesLogsView =
    (selectedLogTypes.length === 1 && selectedLogTypes[0].value === 'pipelines') ||
    (selectedLogTypes.length === 0 &&
      parsedFilters.some((filter) => filter.column === 'pipeline_id'))

  const syncUrlFilters = useEffectEvent(() => {
    setLocalFilterOrigin(null)
    setColumnFilters(buildDefaultColumnFilters({ ...search, filter: visibleSearchFilters }))
  })
  useEffect(() => syncUrlFilters(), [urlFilterScope])

  const { selection, selectRow, clearSelection } = useTableRowSelection({
    scope: JSON.stringify([projectRef, searchParameters]),
    initialId: search.id ?? undefined,
  })
  const previousUrlId = useRef(search.id)
  const hasUrlSelectionChanged = !!scope && previousUrlId.current !== search.id
  useEffect(() => {
    if (!scope || previousUrlId.current === search.id) return
    previousUrlId.current = search.id
    if (search.id === selection.activeId) return
    if (search.id) selectRow([search.id], search.id)
    else clearSelection()
  }, [scope, search.id, selection.activeId, selectRow, clearSelection])
  const rowSelection = selection.selected

  const {
    data: unifiedLogsData,
    error,
    isError,
    isLoading,
    isFetching,
    isSuccess: hasLoadedLogs,
    isPlaceholderData,
    isFetchingNextPage,
    isFetchingPreviousPage,
    hasNextPage,
    refetch: refetchLogs,
    fetchNextPage,
    fetchPreviousPage,
  } = useUnifiedLogsInfiniteQuery({ projectRef, search: searchParameters })

  const {
    data: counts,
    isPending: isLoadingCounts,
    isFetching: isFetchingCounts,
    refetch: refetchCounts,
  } = useUnifiedLogsCountQuery({
    projectRef,
    search: searchParameters,
  })

  const {
    data: unifiedLogsChart = [],
    isFetching: isFetchingCharts,
    refetch: refetchCharts,
  } = useUnifiedLogsChartQuery({
    projectRef,
    search: searchParameters,
  })

  const refetchAllData = () => {
    refetchLogs()
    refetchCounts()
    refetchCharts()
    if (missingSelectedId) selectedLogQuery.refetch()
  }

  const isRefetchingData = isFetching || isFetchingCounts || isFetchingCharts

  const isFetchingButNotPaginating = isFetching && !isFetchingNextPage && !isFetchingPreviousPage

  const flatData: ColumnSchema[] = useMemo(
    () => getUniqueLogRows(unifiedLogsData?.pages),
    [unifiedLogsData?.pages]
  )
  const missingSelectedId =
    scope && selection.activeId && !flatData.some((row) => row.id === selection.activeId)
      ? selection.activeId
      : undefined
  const canFetchSelectedLog =
    !!missingSelectedId && hasLoadedLogs && !isFetching && !isPlaceholderData
  const selectedLogQuery = useQuery({
    ...unifiedLogQueryOptions({ projectRef, search: searchParameters, id: missingSelectedId }),
    enabled: canFetchSelectedLog,
  })
  const tableData = useMemo(
    () =>
      selectedLogQuery.data && missingSelectedId === selectedLogQuery.data.id
        ? [...flatData, selectedLogQuery.data]
        : flatData,
    [flatData, missingSelectedId, selectedLogQuery.data]
  )
  const liveMode = useLiveMode(flatData)

  const totalDBRowCount = counts?.totalRowCount
  const filterDBRowCount = flatData.length

  const facets = counts?.facets
  const totalFetched = flatData?.length

  const filteredChartConfig = useMemo(() => {
    const levelFilters = parseLogsFilterUrlParams(search.filter).filter((f) => f.column === 'level')
    const included = levelFilters.filter((f) => f.operator === '=').map((f) => f.value)
    const excluded = new Set(levelFilters.filter((f) => f.operator === '<>').map((f) => f.value))
    const baseLevels: readonly string[] = included.length > 0 ? included : LEVELS
    const activeLevels = baseLevels.filter((l) => !excluded.has(l))
    return Object.fromEntries(
      LEVELS.filter((level) => activeLevels.includes(level)).map((level) => [
        level,
        {
          ...CHART_CONFIG[level],
          label: <TooltipLabel level={level} isProcessLog={isPipelinesLogsView} />,
        },
      ])
    ) as ChartConfig
  }, [search.filter, isPipelinesLogsView])

  const getRowClassName = (row: Row<ColumnSchema>) =>
    getLogRowClassName(row.original, liveMode.timestamp)

  const { columns: dynamicColumns, columnVisibility: dynamicColumnVisibility } = useMemo(() => {
    return generateDynamicColumns({ data: tableData })
  }, [tableData])

  const table: Table<ColumnSchema> = useReactTable<ColumnSchema>({
    data: tableData,
    columns: dynamicColumns,
    state: {
      columnFilters,
      sorting,
      columnVisibility: { ...dynamicColumnVisibility, ...columnVisibility },
      rowSelection,
      columnOrder,
    },
    enableMultiRowSelection: true,
    columnResizeMode: 'onChange',
    filterFns: { inDateRange, arrSome },
    meta: { getRowClassName },
    getRowId: (row) => row.id,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: (updater) => {
      setLocalFilterOrigin(urlFilterScope)
      setColumnFilters(updater)
    },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getTTableFacetedUniqueValues(),
    getFacetedMinMaxValues: getTTableFacetedMinMaxValues(),
  })

  const selectedRows = table.getSelectedRowModel().rows
  const selectedRow =
    selectedRows.find((row) => row.id === selection.activeId) ?? selectedRows.at(-1)
  const openRowId = selectedRow?.id
  const handleSelectRow = (id: string, modifiers?: RowSelectionModifiers) => {
    selectRow(
      table.getRowModel().rows.map((row) => row.id),
      id,
      modifiers
    )
  }
  const setOpenRowId = (id: string | undefined) => {
    if (id) handleSelectRow(id)
    else clearSelection()
  }

  const filterFields = useMemo(() => {
    const canFilterByPipeline = queryLogTypeVisibility.pipelines !== false
    const gatedFields = gateLogTypeOptions(
      defaultFilterFields.filter(
        (field) =>
          isOfferedFilter(field.value, offeredFilters) &&
          (field.value !== 'pipeline_id' || canFilterByPipeline)
      ),
      queryLogTypeVisibility
    )

    return gatedFields.map((field) => {
      if (field.value === 'level' && isPipelinesLogsView) {
        return {
          ...field,
          options: LEVELS.map((level) => ({
            value: level,
            label: PIPELINE_LOG_LEVEL_LABELS[level],
            count: facets?.level?.rows.find((row) => row.value === level)?.total ?? 0,
          })),
          component: PipelineLevelOption,
        }
      }
      const facetsField = facets?.[field.value]

      if (!facetsField) return field

      if (field.value === 'log_type' || field.value === 'method' || field.value === 'level') {
        const fieldWithCounts = {
          ...field,
          options: field.options.map((x) => {
            return { ...x, count: facetsField.rows.find((y) => y.value === x.value)?.total ?? 0 }
          }),
        }
        return fieldWithCounts
      }

      const options: Option[] = facetsField.rows.map(({ value, total }) => ({
        label: `${value}`,
        value,
        count: total,
      }))

      return { ...field, options }
    })
  }, [facets, offeredFilters, queryLogTypeVisibility, isPipelinesLogsView])

  const filterableNames = useMemo(
    () => new Set(filterFields.map((field) => field.value)),
    [filterFields]
  )
  const activeView =
    [...PRESET_VIEWS, ...savedViews].find((view) => view.id === activeViewId) ?? null
  const isActiveViewPreset = isPresetViewId(activeViewId)
  const isActiveViewModified = activeView ? isViewModified(activeView, search) : false
  const activeFilterCount = parseLogsFilterUrlParams(search.filter).length
  const logSource = getLogAttributeSources(searchParameters)[0] ?? 'edge_logs'
  const filterCombinationKey = getFilterCombinationKey(search.filter)
  const updateSuggestionKey = activeView ? `${activeView.id}:${filterCombinationKey}` : null
  const isViewModifiedUnacknowledged =
    showSavedViews &&
    !!activeView &&
    isActiveViewModified &&
    !isSavingNewView &&
    updateSuggestionKey !== dismissedUpdateKey
  const canReviewChanges = showSavedViews && !!activeView && isActiveViewModified
  const isViewModifiedPopoverOpen =
    ((isViewsSectionOpen && isFilterBarOpen) || isMobileViewsDrawerOpen) &&
    isActiveViewRowMounted &&
    (isViewModifiedUnacknowledged || (isReviewingChanges && canReviewChanges))

  const handleApplyView = (view: LogsView) => {
    const { params, dropped } = applyView(view, { filterableNames })
    if (dropped.length > 0) {
      console.warn(`Saved view "${view.name}" dropped unknown filters/options:`, dropped)
    }
    setSorting(params.sort ? [params.sort] : [])
    setSearch(params)
    setActiveViewId(view.id)
    setIsReviewingChanges(false)
  }

  const handleOpenViewsSection = () => {
    setIsViewsSectionOpen(true)
    setIsFilterBarOpen(true)
    setDismissedUpdateKey(null)
  }

  const handleUpdateActiveView = async () => {
    if (!activeView) return
    const { filters, viewOptions } = serializeView({
      name: activeView.name,
      logSource: activeView.logSource,
      search,
    })
    try {
      await updateSavedView(activeView.id, { filters, viewOptions })
      setIsReviewingChanges(false)
      setDismissedUpdateKey(null)
      toast.success('View updated')
    } catch {
      return
    }
  }

  const handleStartSaveView = () => {
    handleOpenViewsSection()
    setSaveViewProjectRef(projectRef ?? null)
  }

  const handleResetToActiveView = () => {
    if (!activeView) return
    handleApplyView(activeView)
  }

  const handleReviewChanges = () => {
    setDismissedUpdateKey(null)
    setIsReviewingChanges(true)
  }

  const handleClearActiveView = () => {
    setActiveViewId(null)
    setIsReviewingChanges(false)
    setDismissedUpdateKey(null)
  }

  const handleDuplicateView = async (view: LogsView, name: string) => {
    const savedProjectRef = projectRef
    const id = await createSavedView({
      name,
      logSource: view.logSource,
      filters: view.filters,
      viewOptions: view.viewOptions,
    })
    if (currentProjectRef.current === savedProjectRef) handleApplyView({ ...view, id, name })
    toast.success('View saved')
  }

  const handleCreateView = async (name: string) => {
    const savedProjectRef = projectRef
    const input = serializeView({ name, logSource, search })
    const id = await createSavedView(input)
    if (currentProjectRef.current === savedProjectRef) {
      setActiveViewId(id)
      setSaveViewProjectRef(null)
      setIsReviewingChanges(false)
    }
    toast.success('View saved')
  }

  const handleDismissUpdateSuggestion = () => {
    setDismissedUpdateKey(updateSuggestionKey)
    setIsReviewingChanges(false)
  }

  const applyFilterSearch = () => {
    const offeredColumnFilters = columnFilters.filter(
      ({ id }) =>
        !defaultFilterFields.some((field) => field.value === id) ||
        isOfferedFilter(id, offeredFilters)
    )
    const update = buildFilterSearchUpdate(offeredColumnFilters, filterFields)
    if (Array.isArray(update.filter)) {
      update.filter = gateLogTypeFilters(update.filter.map(String), queryLogTypeVisibility)
    }
    setSearch(update)
  }

  useFilterSearchSync({
    applyFilterSearch,
    columnFilters,
    enabled: computeAvailability.readyToSyncFilters && !isLoadingPipelinesLogs,
  })

  useEffect(() => {
    setSearch({ sort: sorting?.[0] || null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting])

  useEffect(() => {
    if (isLoading || isFetching || hasUrlSelectionChanged) return
    if (missingSelectedId && (!selectedLogQuery.isSuccess || isPlaceholderData)) return

    if (openRowId && !selectedRow) {
      setSearch({ id: null })
      setOpenRowId(undefined)
    } else if (openRowId && selectedRow) {
      if (search.id !== openRowId) setSearch({ id: openRowId })
      const logType = LOG_TYPES.find((type) => type === selectedRow.original.log_type)
      if (logType) track('unified_logs_row_clicked', { logType })
    } else if (!openRowId && search.id) {
      setSearch({ id: null })
      if (missingSelectedId) clearSelection()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    openRowId,
    selectedRow,
    isLoading,
    isFetching,
    missingSelectedId,
    selectedLogQuery.isSuccess,
    isPlaceholderData,
    hasUrlSelectionChanged,
  ])

  useShortcut(SHORTCUT_IDS.DATA_TABLE_TOGGLE_FILTERS, () => setIsFilterBarOpen((prev) => !prev), {
    enabled: hasFilterSideBar,
    registerInCommandMenu: true,
  })
  useShortcut(SHORTCUT_IDS.UNIFIED_LOGS_CLEAR_FILTERS, () => table.resetColumnFilters(), {
    enabled: columnFilters.length > 0,
    registerInCommandMenu: true,
  })

  useEffect(() => {
    if (isMobile) {
      setIsFilterBarOpen(false)
      setIsViewsSectionOpen(false)
    } else {
      setIsFilterBarOpen(true)
      setIsMobileViewsDrawerOpen(false)
    }
  }, [isMobile])

  const savedViewsIconClassName = cn(
    activeView && !isActiveViewModified && 'text-brand-600',
    isActiveViewModified && 'text-warning'
  )
  const getSavedViewsTooltip = () => {
    if (!activeView) return 'Saved views'
    if (isActiveViewModified) return `Saved views · ${activeView.name} (modified)`
    return `Saved views · ${activeView.name}`
  }

  const savedViewsEntry = showSavedViews ? (
    <div className="flex flex-col gap-0.5">
      <SavedViewsEntry
        activeView={activeView}
        isActiveViewModified={isActiveViewModified}
        onOpen={handleOpenViewsSection}
      />
      {canCreateView && (
        <NewViewEntry
          disabled={isSavingNewView || activeFilterCount < MIN_FILTERS_TO_SAVE}
          onClick={handleStartSaveView}
        />
      )}
    </div>
  ) : undefined

  const saveViewAction = canCreateView ? (
    <ButtonTooltip
      size="tiny"
      variant="outline"
      className="size-7 shrink-0 px-0"
      icon={<PlusIcon />}
      aria-label="Save current filters as a view"
      disabled={isSavingNewView || activeFilterCount < MIN_FILTERS_TO_SAVE}
      tooltip={{
        content: {
          side: 'bottom',
          text:
            activeFilterCount < MIN_FILTERS_TO_SAVE
              ? 'Add a filter to save a view'
              : 'Save current filters as a view',
        },
      }}
      onClick={handleStartSaveView}
    />
  ) : undefined

  const renderViewsPanel = (activeRowRef: (node: HTMLDivElement | null) => void) => (
    <LogsViewsPanel
      key={projectRef}
      views={savedViews}
      isLoading={isLoadingSavedViews}
      isError={isErrorSavedViews}
      isPending={isSavingView}
      canUpdate={canUpdateView}
      canDelete={canDeleteView}
      activeViewId={activeView?.id ?? null}
      isActiveViewModified={isActiveViewModified}
      isSaving={isSavingNewView}
      activeRowRef={activeRowRef}
      onRetry={retrySavedViews}
      onApply={handleApplyView}
      onReviewChanges={handleReviewChanges}
      canCreate={canCreateView}
      onRename={(id, name) => updateSavedView(id, { name })}
      onDelete={deleteSavedView}
      onDuplicate={handleDuplicateView}
      onCancelSave={() => setSaveViewProjectRef(null)}
      onSubmitSave={handleCreateView}
    />
  )
  const sidebarViewsPanel = renderViewsPanel(setSidebarActiveViewRow)
  const mobileViewsPanel = renderViewsPanel(setMobileActiveViewRow)

  return (
    <>
      <DataTableProvider
        table={table}
        error={error}
        columns={UNIFIED_LOGS_COLUMNS}
        filterFields={filterFields}
        columnFilters={columnFilters}
        sorting={sorting}
        rowSelection={rowSelection}
        openRowId={openRowId}
        setOpenRowId={setOpenRowId}
        onSelectRow={handleSelectRow}
        columnOrder={columnOrder}
        columnVisibility={columnVisibility}
        searchParameters={searchParameters}
        hasPendingFilterChange={localFilterOrigin === urlFilterScope}
        enableColumnOrdering={true}
        isFetching={isFetching}
        isError={isError}
        isLoading={isLoading}
        isLoadingCounts={isLoadingCounts}
        getFacetedUniqueValues={getFacetedUniqueValues(facets)}
      >
        <DataTableSideBarLayout topBarHeight={topBarHeight}>
          <ResizablePanelGroup
            orientation="horizontal"
            autoSaveId={
              columnPreferencesKey ? `logs-layout-${columnPreferencesKey}` : 'logs-layout'
            }
          >
            {hasFilterSideBar && (
              <>
                <FilterSideBar
                  isFilterBarOpen={isFilterBarOpen}
                  setIsFilterBarOpen={setIsFilterBarOpen}
                  dateRangeDisabled={{ after: new Date() }}
                  onReset={handleClearActiveView}
                  onExitSection={() => setIsViewsSectionOpen(false)}
                  savedViewsEntry={savedViewsEntry}
                  section={
                    showSavedViews && isViewsSectionOpen
                      ? { label: 'Views', action: saveViewAction, content: sidebarViewsPanel }
                      : undefined
                  }
                />
                <ResizableHandle withHandle />
              </>
            )}
            <ResizablePanel
              id="panel-right"
              className="flex max-w-full flex-1 flex-col overflow-hidden"
            >
              <div ref={topBarRef} className="top-0 z-10 flex flex-col bg-background">
                {isError && flatData.length > 0 && (
                  <AlertError
                    error={error}
                    subject="Failed to refresh logs"
                    projectRef={projectRef}
                  />
                )}
                <div className="flex flex-wrap items-center gap-0 border-b px-0 sm:gap-2 sm:px-2">
                  {hasFilterSideBar && (
                    <>
                      <ShortcutTooltip
                        shortcutId={SHORTCUT_IDS.DATA_TABLE_TOGGLE_FILTERS}
                        side="bottom"
                      >
                        <Button
                          size="tiny"
                          variant="text"
                          icon={isFilterBarOpen ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
                          onClick={() => setIsFilterBarOpen((prev) => !prev)}
                          className="hidden w-[26px] sm:flex"
                          aria-label={isFilterBarOpen ? 'Hide filters' : 'Show filters'}
                        />
                      </ShortcutTooltip>

                      <div className="hidden h-full border-r sm:block" />
                    </>
                  )}

                  <div className="order-first w-full min-w-0 px-2 py-2 sm:order-none sm:w-auto sm:flex-1 sm:px-0">
                    <LogsFilterBar offeredFilters={offeredFilters} />
                  </div>

                  <div className="order-last flex w-full items-center justify-end gap-x-2 border-t px-2 pt-2 pb-2 sm:order-none sm:ml-auto sm:w-auto sm:justify-start sm:border-t-0 sm:px-0 sm:pt-0 sm:pb-0">
                    {hasFilterSideBar && (
                      <div className="mr-auto flex items-center gap-x-1 sm:hidden">
                        <DataTableFilterControlsDrawer />
                        {showSavedViews && (
                          <Drawer
                            open={isMobileViewsDrawerOpen}
                            onOpenChange={setIsMobileViewsDrawerOpen}
                          >
                            <DrawerTrigger asChild>
                              <Button
                                size="tiny"
                                variant="text"
                                className="w-[26px]"
                                icon={<Layers2Icon className={savedViewsIconClassName} />}
                                aria-label={getSavedViewsTooltip()}
                              />
                            </DrawerTrigger>
                            <DrawerContent className="max-h-[calc(100dvh-4rem)]">
                              <DrawerHeader className="flex flex-row items-center justify-between">
                                <DrawerTitle>Views</DrawerTitle>
                                <VisuallyHidden.VisuallyHidden>
                                  <DrawerDescription>Apply or manage saved views</DrawerDescription>
                                </VisuallyHidden.VisuallyHidden>
                                {saveViewAction}
                              </DrawerHeader>
                              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                                {mobileViewsPanel}
                              </div>
                              <DrawerFooter>
                                <DrawerClose asChild>
                                  <Button variant="outline" className="w-full">
                                    Close
                                  </Button>
                                </DrawerClose>
                              </DrawerFooter>
                            </DrawerContent>
                          </Drawer>
                        )}
                      </div>
                    )}
                    <RefreshButton
                      isLoading={isRefetchingData}
                      onRefresh={refetchAllData}
                      shortcutId={SHORTCUT_IDS.UNIFIED_LOGS_REFRESH}
                    />
                    <DataTableViewOptions />
                    <DownloadLogsButton searchParameters={searchParameters} />
                    {fetchPreviousPage ? (
                      <LiveButton
                        fetchPreviousPage={fetchPreviousPage}
                        searchParamsParser={SEARCH_PARAMS_PARSER}
                      />
                    ) : null}
                  </div>
                </div>

                {isLoading ? (
                  <div className="h-[60px] flex items-center justify-center">
                    <Loader2Icon size={14} className="animate-spin text-foreground-lighter" />
                  </div>
                ) : (
                  <TimelineChart
                    data={unifiedLogsChart}
                    className={cn(
                      '-mb-1.5 mt-1.5',
                      isFetchingCharts && 'opacity-60 transition-opacity duration-150'
                    )}
                    columnId="timestamp"
                    filterColumnId="date"
                    chartConfig={filteredChartConfig}
                  />
                )}
              </div>

              {selectedLogQuery.isError && (
                <AlertError
                  error={selectedLogQuery.error}
                  subject="Failed to retrieve logs"
                  projectRef={projectRef}
                />
              )}
              <ResizablePanelGroup
                key="main-logs"
                className="flex-1 border-t"
                orientation={dock === 'bottom' ? 'vertical' : 'horizontal'}
              >
                <ResizablePanel
                  defaultSize="100"
                  minSize="10"
                  className={cn(
                    'bg',
                    isFetchingButNotPaginating && 'opacity-60 transition-opacity duration-150'
                  )}
                >
                  <LogsTable
                    columns={UNIFIED_LOGS_COLUMNS}
                    totalRows={totalDBRowCount}
                    filterRows={filterDBRowCount}
                    totalRowsFetched={totalFetched}
                    fetchNextPage={fetchNextPage}
                    hasNextPage={hasNextPage}
                    setColumnOrder={setColumnOrder}
                    setColumnVisibility={setColumnVisibility}
                    emptyStateMessage={
                      isUserFilterUnreachable(searchParameters) ? (
                        <div className="text-sm flex flex-col gap-y-1">
                          <p className="text-foreground-light">No results found</p>
                          <p className="text-foreground-lighter">
                            Filtering by user is only supported for Auth and API Gateway log types
                          </p>
                        </div>
                      ) : undefined
                    }
                  />
                </ResizablePanel>

                {!!openRowId && !!selectedRow && (
                  <>
                    {selectedRows.length === 1 && <LogsListPanel selectedRow={selectedRow} />}
                    <ServiceFlowPanel
                      dock={dock}
                      setDock={setDock}
                      selectedRows={selectedRows.map((row) => row.original)}
                      searchParameters={searchParameters}
                    />
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </DataTableSideBarLayout>
      </DataTableProvider>
      {showSavedViews && activeView && (
        <ViewModifiedPopover
          open={isViewModifiedPopoverOpen}
          onOpenChange={setIsReviewingChanges}
          anchorRef={activeViewRowRef}
          viewName={activeView.name}
          canUpdate={canUpdateView && !isActiveViewPreset}
          canCreate={canCreateView}
          isPreset={isActiveViewPreset}
          isPending={isSavingView}
          onUpdate={handleUpdateActiveView}
          onSaveAsNew={handleStartSaveView}
          onReset={handleResetToActiveView}
          onDismiss={handleDismissUpdateSuggestion}
        />
      )}
    </>
  )
}
