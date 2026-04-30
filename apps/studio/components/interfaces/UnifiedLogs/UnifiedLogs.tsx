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
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useQueryStates } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  ChartConfig,
  cn,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useIsMobile,
} from 'ui'

import { RefreshButton } from '../../ui/DataTable/RefreshButton'
import { generateDynamicColumns, UNIFIED_LOGS_COLUMNS } from './components/Columns'
import { DownloadLogsButton } from './components/DownloadLogsButton'
import { LogsListPanel } from './components/LogsListPanel'
import { TooltipLabel } from './components/TooltipLabel'
import { ServiceFlowPanel } from './ServiceFlowPanel'
import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import { filterFields as defaultFilterFields } from './UnifiedLogs.fields'
import { useLiveMode, useResetFocus } from './UnifiedLogs.hooks'
import { QuerySearchParamsType } from './UnifiedLogs.types'
import { getFacetedUniqueValues, getLevelRowClassName } from './UnifiedLogs.utils'
import { arrSome, inDateRange } from '@/components/ui/DataTable/DataTable.utils'
import { DataTableFilterCommand } from '@/components/ui/DataTable/DataTableFilters/DataTableFilterCommand'
import { DataTableFilterControlsDrawer } from '@/components/ui/DataTable/DataTableFilters/DataTableFilterControlsDrawer'
import { DataTableInfinite } from '@/components/ui/DataTable/DataTableInfinite'
import { DataTableSideBarLayout } from '@/components/ui/DataTable/DataTableSideBarLayout'
import { DataTableViewOptions } from '@/components/ui/DataTable/DataTableViewOptions'
import { FilterSideBar } from '@/components/ui/DataTable/FilterSideBar'
import { LiveButton } from '@/components/ui/DataTable/LiveButton'
import { Kbd } from '@/components/ui/DataTable/primitives/Kbd'
import { DataTableProvider } from '@/components/ui/DataTable/providers/DataTableProvider'
import { TimelineChart } from '@/components/ui/DataTable/TimelineChart'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'
import { useUnifiedLogsChartQuery } from '@/data/logs/unified-logs-chart-query'
import { useUnifiedLogsCountQuery } from '@/data/logs/unified-logs-count-query'
import { useUnifiedLogsInfiniteQuery } from '@/data/logs/unified-logs-infinite-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useTrack } from '@/lib/telemetry/track'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const CHART_CONFIG = {
  success: {
    label: <TooltipLabel level="success" />,
    color: 'hsl(var(--foreground-muted))',
  },
  warning: {
    label: <TooltipLabel level="warning" />,
    color: 'hsl(var(--warning-default))',
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

  const { sort, start, size, id, cursor, direction, live, ...filter } = search
  const defaultColumnSorting = sort ? [sort] : []
  const defaultColumnVisibility = { uuid: false }
  const defaultRowSelection = search.id ? { [search.id]: true } : {}
  const defaultColumnFilters = Object.entries(filter)
    .map(([key, value]) => ({ id: key, value }))
    .filter(({ value }) => value ?? undefined)

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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(defaultRowSelection)

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
        {} as Record<string, any>
      ) as QuerySearchParamsType,
    [search]
  )

  const {
    data: unifiedLogsData,
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

  // Create a filtered version of the chart config based on selected levels
  const filteredChartConfig = useMemo(() => {
    const levelFilter = search.level || ['success', 'warning', 'error']
    return Object.fromEntries(
      Object.entries(CHART_CONFIG).filter(([key]) => levelFilter.includes(key as any))
    ) as ChartConfig
  }, [search.level])

  const getRowClassName = <TData extends { date: Date; level: string; timestamp: number }>(
    row: Row<TData>
  ) => {
    const rowTimestamp = row.original.timestamp
    const isPast = rowTimestamp <= (liveMode.timestamp || -1)
    const levelClassName = getLevelRowClassName(row.original.level as any)
    return cn(levelClassName, isPast ? 'opacity-50' : 'opacity-100', 'h-[30px]')
  }

  // Generate dynamic columns based on current data
  const { columns: dynamicColumns, columnVisibility: dynamicColumnVisibility } = useMemo(() => {
    return generateDynamicColumns(flatData)
  }, [flatData])

  const table: Table<any> = useReactTable({
    data: flatData,
    columns: dynamicColumns,
    state: {
      columnFilters,
      sorting,
      columnVisibility: { ...columnVisibility, ...dynamicColumnVisibility },
      rowSelection,
      columnOrder,
    },
    enableMultiRowSelection: false,
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

  const selectedRowKey = Object.keys(rowSelection)?.[0]
  const selectedRow = useMemo(() => {
    if ((isLoading || isFetching) && !flatData.length) return

    return table.getCoreRowModel().flatRows.find((row) => row.id === selectedRowKey)
  }, [isLoading, isFetching, flatData.length, table, selectedRowKey])

  // REMINDER: this is currently needed for the cmdk search
  // [Joshen] This is where facets are getting dynamically loaded
  // TODO: auto search via API when the user changes the filter instead of hardcoded

  // Will need to refactor this bit
  // - Each facet just handles its own state, rather than getting passed down like this
  const filterFields = useMemo(() => {
    return defaultFilterFields.map((field) => {
      const facetsField = facets?.[field.value]

      // If no facets data available, use the predefined field
      if (!facetsField) return field

      // For hardcoded enum fields, keep the predefined options (facets only used for counts)
      const isHardcodedField = ['log_type', 'method', 'level'].includes(field.value as string)
      if (isHardcodedField) {
        return field // Keep original predefined options
      }

      // For dynamic fields, use faceted options
      const options = facetsField.rows.map(({ value }) => ({ label: `${value}`, value }))

      if (field.type === ('slider' as any)) {
        return {
          ...(field as any),
          min: facetsField.min ?? (field as any).min,
          max: facetsField.max ?? (field as any).max,
          options,
        }
      }

      return { ...field, options }
    })
  }, [facets])

  // Debounced filter application to avoid too many API calls when user clicks multiple filters quickly
  const applyFilterSearch = () => {
    const columnFiltersWithNullable = filterFields.map((field) => {
      const filterValue = columnFilters.find((filter) => filter.id === field.value)
      if (!filterValue) return { id: field.value, value: null }
      return { id: field.value, value: filterValue.value }
    })

    const search = columnFiltersWithNullable.reduce(
      (prev, curr) => {
        // Add to search parameters
        prev[curr.id as string] = curr.value
        return prev
      },
      {} as Record<string, unknown>
    )

    setSearch(search)
  }

  const debouncedApplyFilterSearch = useDebounce(applyFilterSearch, 1000)

  useEffect(() => {
    debouncedApplyFilterSearch()
  }, [columnFilters, debouncedApplyFilterSearch])

  useEffect(() => {
    setSearch({ sort: sorting?.[0] || null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting])

  useEffect(() => {
    if (isLoading || isFetching) return
    const selectedRowId = Object.keys(rowSelection)?.[0]

    if (selectedRowId && !selectedRow) {
      // Clear both uuid and logId when no row is selected
      setSearch({ id: null })
      setRowSelection({})
    } else if (selectedRowId && selectedRow) {
      setSearch({
        id: selectedRowId,
      })
      track('unified_logs_row_clicked', { logType: selectedRow.original.log_type })
      // Don't clear rowSelection here - let it persist to maintain the selection
    } else if (!selectedRowId && search.id) {
      // Clear the URL parameter when no row is selected
      setSearch({ id: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, selectedRow, isLoading, isFetching])

  const isMobile = useIsMobile()
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(!isMobile)

  useShortcut(SHORTCUT_IDS.DATA_TABLE_TOGGLE_FILTERS, () => setIsFilterBarOpen((prev) => !prev))

  useEffect(() => {
    if (isMobile) {
      setIsFilterBarOpen(false)
    } else {
      setIsFilterBarOpen(true)
    }
  }, [isMobile])

  return (
    <DataTableProvider
      table={table}
      columns={UNIFIED_LOGS_COLUMNS}
      filterFields={filterFields}
      columnFilters={columnFilters}
      sorting={sorting}
      rowSelection={rowSelection}
      columnOrder={columnOrder}
      columnVisibility={columnVisibility}
      searchParameters={searchParameters}
      enableColumnOrdering={true}
      isFetching={isFetching}
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
            <div ref={topBarRef} className="top-0 z-10 flex flex-col gap-2 bg-background pb-3">
              <div className="flex flex-wrap items-center gap-2 px-2 pt-2.5 pb-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="tiny"
                      type="text"
                      icon={isFilterBarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
                      onClick={() => setIsFilterBarOpen((prev) => !prev)}
                      className="hidden w-[26px] sm:flex"
                      aria-label={isFilterBarOpen ? 'Hide filters' : 'Show filters'}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>
                      Toggle controls with{' '}
                      <Kbd className="ml-1 text-muted-foreground group-hover:text-accent-foreground">
                        <span className="mr-1">⌘</span>
                        <span>B</span>
                      </Kbd>
                    </p>
                  </TooltipContent>
                </Tooltip>
                <div className="order-first w-full min-w-0 sm:order-0 sm:w-auto sm:flex-1 **:[[cmdk-input-wrapper]]:px-3! [&_button]:px-3! [&_button>span]:h-[26px]! [&_button>span]:py-0! [&_input]:h-[26px]! [&_input]:py-0!">
                  <DataTableFilterCommand
                    placeholder="Search logs..."
                    searchParamsParser={SEARCH_PARAMS_PARSER}
                  />
                </div>
                <div className="block sm:hidden">
                  <DataTableFilterControlsDrawer />
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <FeaturePreviewBadge featureKey={LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS} />
                  <RefreshButton isLoading={isRefetchingData} onRefresh={refetchAllData} />
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
              <TimelineChart
                data={unifiedLogsChart}
                className={cn(
                  '-mb-2',
                  isFetchingCharts && 'opacity-60 transition-opacity duration-150'
                )}
                columnId="timestamp"
                chartConfig={filteredChartConfig}
              />
            </div>
            <ResizablePanelGroup key="main-logs" orientation="vertical" className="flex-1">
              <ResizablePanel
                defaultSize="100"
                minSize="30"
                className={cn(
                  'bg',
                  isFetchingButNotPaginating && 'opacity-60 transition-opacity duration-150'
                )}
              >
                <div className="h-full [&>div]:h-full [&_thead_tr]:bg-[linear-gradient(to_bottom,hsl(var(--background-default)),hsl(var(--background-surface-75)))]! [&_thead_th]:[border-top:none]! [&_thead_th]:[border-bottom:none]! [&_thead_th]:[box-shadow:inset_0_-1px_0_hsl(var(--border-default))]! [&_thead_tr]:border-b-0! [&_tbody_tr]:border-b-0! [&_thead_tr:hover]:bg-[linear-gradient(to_bottom,hsl(var(--background-default)),hsl(var(--background-surface-75)))]! [&_thead_th]:text-foreground-lighter!">
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
              <LogsListPanel selectedRow={selectedRow} />
              {selectedRowKey && (
                <ServiceFlowPanel
                  selectedRow={selectedRow?.original}
                  selectedRowKey={selectedRowKey}
                  searchParameters={searchParameters}
                />
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </DataTableSideBarLayout>
    </DataTableProvider>
  )
}
