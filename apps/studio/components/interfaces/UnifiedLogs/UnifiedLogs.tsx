import {
  ColumnFiltersState,
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedMinMaxValues as getTTableFacetedMinMaxValues,
  getFacetedUniqueValues as getTTableFacetedUniqueValues,
  Row,
  RowSelectionState,
  SortingState,
  Table,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { LOCAL_STORAGE_KEYS, useDebounce, useParams } from 'common'
import { Loader2, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useQueryStates } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  ChartConfig,
  cn,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  useIsMobile,
} from 'ui'

import { RefreshButton } from '../../ui/DataTable/RefreshButton'
import { generateDynamicColumns, UNIFIED_LOGS_COLUMNS } from './components/Columns'
import { DownloadLogsButton } from './components/DownloadLogsButton'
import { LogsFilterBar } from './components/LogsFilterBar'
import { LogsListPanel } from './components/LogsListPanel'
import { TooltipLabel } from './components/TooltipLabel'
import { RowSelectionHeader } from './RowSelectionHeader'
import { ServiceFlowPanel } from './ServiceFlowPanel'
import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import { filterFields as defaultFilterFields } from './UnifiedLogs.fields'
import {
  buildFilterSearchUpdate,
  logsFiltersToColumnFilters,
  parseLogsFilterUrlParams,
} from './UnifiedLogs.filters'
import { useLiveMode, useResetFocus } from './UnifiedLogs.hooks'
import { ColumnSchema } from './UnifiedLogs.schema'
import { QuerySearchParamsType } from './UnifiedLogs.types'
import {
  gateMultigresLogType,
  getFacetedUniqueValues,
  getLevelRowClassName,
} from './UnifiedLogs.utils'
import { LEVELS } from '@/components/ui/DataTable/DataTable.constants'
import { Option } from '@/components/ui/DataTable/DataTable.types'
import { arrSome, inDateRange } from '@/components/ui/DataTable/DataTable.utils'
import { DataTableFilterControlsDrawer } from '@/components/ui/DataTable/DataTableFilters/DataTableFilterControlsDrawer'
import { DataTableInfinite } from '@/components/ui/DataTable/DataTableInfinite'
import { DataTableSideBarLayout } from '@/components/ui/DataTable/DataTableSideBarLayout'
import { DataTableViewOptions } from '@/components/ui/DataTable/DataTableViewOptions'
import { FilterSideBar } from '@/components/ui/DataTable/FilterSideBar'
import { LiveButton } from '@/components/ui/DataTable/LiveButton'
import { DataTableProvider } from '@/components/ui/DataTable/providers/DataTableProvider'
import { TimelineChart } from '@/components/ui/DataTable/TimelineChart'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useUnifiedLogsChartQuery } from '@/data/logs/unified-logs-chart-query'
import { useUnifiedLogsCountQuery } from '@/data/logs/unified-logs-count-query'
import { useUnifiedLogsInfiniteQuery } from '@/data/logs/unified-logs-infinite-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useShowMultigresLogs } from '@/hooks/misc/useShowMultigresLogs'
import { useTrack } from '@/lib/telemetry/track'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const CHART_CONFIG = {
  success: {
    label: <TooltipLabel level="success" />,
    color: 'var(--chart-success)',
  },
  warning: {
    label: <TooltipLabel level="warning" />,
    color: 'var(--chart-warning)',
  },
  error: {
    label: <TooltipLabel level="error" />,
    color: 'hsl(var(--destructive-default))',
  },
} satisfies ChartConfig

export const UnifiedLogs = () => {
  useResetFocus()

  const { ref: projectRef } = useParams()
  const track = useTrack()
  const [search, setSearch] = useQueryStates(SEARCH_PARAMS_PARSER)

  const defaultColumnSorting = search.sort ? [search.sort] : []
  const defaultColumnVisibility = { uuid: false }
  const defaultColumnFilters = logsFiltersToColumnFilters(parseLogsFilterUrlParams(search.filter))

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

  const showMultigresLogs = useShowMultigresLogs()

  const [sorting, setSorting] = useState<SortingState>(defaultColumnSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(defaultColumnFilters)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [openRowId, setOpenRowId] = useState<string | undefined>(search.id ?? undefined)

  const [dock, setDock] = useLocalStorageQuery<'bottom' | 'right'>(
    LOCAL_STORAGE_KEYS.UNIFIED_LOGS_DOCK,
    'bottom'
  )

  const [columnVisibility, setColumnVisibility] = useLocalStorageQuery<VisibilityState>(
    'data-table-visibility',
    defaultColumnVisibility
  )
  const [columnOrder, setColumnOrder] = useLocalStorageQuery<string[]>(
    'data-table-column-order',
    []
  )

  // Create a stable query key object by removing nulls/undefined, id, and live
  // Mainly to prevent the react queries from unnecessarily re-fetching
  const searchParameters = useMemo(
    () =>
      Object.entries(search).reduce(
        (acc, [key, value]) => {
          if (!['id', 'live'].includes(key) && value !== null && value !== undefined) {
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, unknown>
      ) as QuerySearchParamsType,
    [search]
  )

  const {
    data: unifiedLogsData,
    error,
    isError,
    isLoading,
    isFetching,
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
  }

  const isRefetchingData = isFetching || isFetchingCounts || isFetchingCharts

  // Only fade when filtering (not when loading more data or live mode)
  const isFetchingButNotPaginating = isFetching && !isFetchingNextPage && !isFetchingPreviousPage

  const rawFlatData = useMemo(() => {
    return unifiedLogsData?.pages?.flatMap((page) => page.data ?? []) ?? []
  }, [unifiedLogsData?.pages])
  // [Joshen] Refer to unified-logs-infinite-query on why the need to deupe
  const flatData = useMemo(() => {
    return rawFlatData.filter((value, idx) => {
      return idx === rawFlatData.findIndex((x) => x.id === value.id)
    })
  }, [rawFlatData])
  const liveMode = useLiveMode(flatData)

  const totalDBRowCount = counts?.totalRowCount
  const filterDBRowCount = flatData.length

  const facets = counts?.facets
  const totalFetched = flatData?.length

  // Create a filtered version of the chart config based on level filters in the URL.
  const filteredChartConfig = useMemo(() => {
    const levelFilters = parseLogsFilterUrlParams(search.filter).filter((f) => f.column === 'level')
    const included = levelFilters.filter((f) => f.operator === '=').map((f) => f.value)
    const excluded = new Set(levelFilters.filter((f) => f.operator === '<>').map((f) => f.value))
    const baseLevels: readonly string[] = included.length > 0 ? included : LEVELS
    const activeLevels = baseLevels.filter((l) => !excluded.has(l))
    return Object.fromEntries(
      Object.entries(CHART_CONFIG).filter(([key]) => activeLevels.includes(key))
    ) as ChartConfig
  }, [search.filter])

  const getRowClassName = <
    TData extends { date: Date; level: (typeof LEVELS)[number]; timestamp: number },
  >(
    row: Row<TData>
  ) => {
    const rowTimestamp = row.original.timestamp
    const isPast = rowTimestamp <= (liveMode.timestamp || -1)
    const levelClassName = getLevelRowClassName(row.original.level)
    return cn(levelClassName, isPast ? 'opacity-50' : 'opacity-100', 'h-[30px]')
  }

  // Generate dynamic columns based on current data
  const { columns: dynamicColumns, columnVisibility: dynamicColumnVisibility } = useMemo(() => {
    return generateDynamicColumns({ data: flatData })
  }, [flatData])

  const table: Table<ColumnSchema> = useReactTable({
    data: flatData,
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
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getTTableFacetedUniqueValues(),
    getFacetedMinMaxValues: getTTableFacetedMinMaxValues(),
  })

  const selectedRow = useMemo(() => {
    if ((isLoading || isFetching) && !flatData.length) return
    return table.getCoreRowModel().flatRows.find((row) => row.id === openRowId)
  }, [isLoading, isFetching, flatData.length, table, openRowId])

  // Will need to refactor this bit
  // - Each facet just handles its own state, rather than getting passed down like this
  const filterFields = useMemo(() => {
    const gatedFields = gateMultigresLogType(defaultFilterFields, showMultigresLogs)

    return gatedFields.map((field) => {
      const facetsField = facets?.[field.value]

      // If no facets data available, use the predefined field
      if (!facetsField) return field

      // For hardcoded enum fields, keep the predefined options (facets only used for counts)
      if (field.value === 'log_type' || field.value === 'method' || field.value === 'level') {
        const fieldWithCounts = {
          ...field,
          options: field.options.map((x) => {
            return { ...x, count: facetsField.rows.find((y) => y.value === x.value)?.total ?? 0 }
          }),
        }
        return fieldWithCounts
      }

      // For dynamic fields, use faceted options
      const options: Option[] = facetsField.rows.map(({ value, total }) => ({
        label: `${value}`,
        value,
        count: total,
      }))

      return { ...field, options }
    })
  }, [facets, showMultigresLogs])

  const applyFilterSearch = () => {
    setSearch(buildFilterSearchUpdate(columnFilters, filterFields))
  }

  const debouncedApplyFilterSearch = useDebounce(applyFilterSearch, 250)

  useEffect(() => {
    debouncedApplyFilterSearch()
  }, [columnFilters, debouncedApplyFilterSearch])

  useEffect(() => {
    setSearch({ sort: sorting?.[0] || null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting])

  useEffect(() => {
    if (isLoading || isFetching) return

    if (openRowId && !selectedRow) {
      // Clear both uuid and logId when the open row no longer exists in data
      setSearch({ id: null })
      setOpenRowId(undefined)
    } else if (openRowId && selectedRow) {
      setSearch({ id: openRowId })
      track('unified_logs_row_clicked', { logType: selectedRow.original.log_type })
    } else if (!openRowId && search.id) {
      // Clear the URL parameter when no row is open
      setSearch({ id: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRowId, selectedRow, isLoading, isFetching])

  const isMobile = useIsMobile()
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(!isMobile)

  useShortcut(SHORTCUT_IDS.DATA_TABLE_TOGGLE_FILTERS, () => setIsFilterBarOpen((prev) => !prev), {
    registerInCommandMenu: true,
  })
  useShortcut(SHORTCUT_IDS.UNIFIED_LOGS_CLEAR_FILTERS, () => table.resetColumnFilters(), {
    enabled: columnFilters.length > 0,
    registerInCommandMenu: true,
  })

  useEffect(() => {
    if (isMobile) {
      setIsFilterBarOpen(false)
    } else {
      setIsFilterBarOpen(true)
    }
  }, [isMobile])

  useEffect(() => {
    table.resetRowSelection()
  }, [searchParameters, table])

  return (
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
      columnOrder={columnOrder}
      columnVisibility={columnVisibility}
      searchParameters={searchParameters}
      enableColumnOrdering={true}
      isFetching={isFetching}
      isError={isError}
      isLoading={isLoading}
      isLoadingCounts={isLoadingCounts}
      getFacetedUniqueValues={getFacetedUniqueValues(facets)}
    >
      <DataTableSideBarLayout topBarHeight={topBarHeight}>
        <ResizablePanelGroup orientation="horizontal" autoSaveId="logs-layout">
          <FilterSideBar
            isFilterBarOpen={isFilterBarOpen}
            setIsFilterBarOpen={setIsFilterBarOpen}
            dateRangeDisabled={{ after: new Date() }}
          />
          <ResizableHandle withHandle />
          <ResizablePanel
            id="panel-right"
            className="flex max-w-full flex-1 flex-col overflow-hidden"
          >
            <div ref={topBarRef} className="top-0 z-10 flex flex-col bg-background">
              <div className="flex flex-wrap items-center gap-2 px-2 border-b">
                <ShortcutTooltip shortcutId={SHORTCUT_IDS.DATA_TABLE_TOGGLE_FILTERS} side="bottom">
                  <Button
                    size="tiny"
                    variant="text"
                    icon={isFilterBarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
                    onClick={() => setIsFilterBarOpen((prev) => !prev)}
                    className="hidden w-[26px] sm:flex"
                    aria-label={isFilterBarOpen ? 'Hide filters' : 'Show filters'}
                  />
                </ShortcutTooltip>

                <div className="h-full border-r" />

                <div className="order-first w-full min-w-0 sm:order-0 sm:w-auto sm:flex-1 py-2">
                  <LogsFilterBar />
                </div>

                <div className="block sm:hidden">
                  <DataTableFilterControlsDrawer />
                </div>

                <div className="ml-auto flex items-center gap-x-2">
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
                  <Loader2 size={14} className="animate-spin text-foreground-lighter" />
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

            <RowSelectionHeader />

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
                <div
                  className={cn(
                    'h-full [&>div]:h-full',
                    '[&_thead_th]:[border-top:none]! [&_thead_th]:[border-bottom:none]!',
                    '[&_thead_th]:[box-shadow:inset_0_-1px_0_var(--border-default)]!',
                    '[&_thead_th]:text-foreground-lighter! [&_thead_tr:hover]:bg-surface-75',
                    '[&_thead_tr]:border-b-0! [&_tbody_tr]:border-b-0!'
                  )}
                >
                  <DataTableInfinite
                    columns={UNIFIED_LOGS_COLUMNS}
                    totalRows={totalDBRowCount}
                    filterRows={filterDBRowCount}
                    totalRowsFetched={totalFetched}
                    fetchNextPage={fetchNextPage}
                    hasNextPage={hasNextPage}
                    setColumnOrder={setColumnOrder}
                    setColumnVisibility={setColumnVisibility}
                    searchParamsParser={SEARCH_PARAMS_PARSER}
                  />
                </div>
              </ResizablePanel>

              {!!openRowId && !!selectedRow && (
                <>
                  <LogsListPanel selectedRow={selectedRow} />
                  <ServiceFlowPanel
                    dock={dock}
                    setDock={setDock}
                    selectedRow={selectedRow?.original}
                    selectedRowKey={openRowId}
                    searchParameters={searchParameters}
                  />
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </DataTableSideBarLayout>
    </DataTableProvider>
  )
}
