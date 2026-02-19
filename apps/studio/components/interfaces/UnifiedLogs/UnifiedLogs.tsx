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
import { useDebounce, useParams } from 'common'
import { arrSome, inDateRange } from 'components/ui/DataTable/DataTable.utils'
import { DataTableFilterCommand } from 'components/ui/DataTable/DataTableFilters/DataTableFilterCommand'
import { DataTableHeaderLayout } from 'components/ui/DataTable/DataTableHeaderLayout'
import { DataTableInfinite } from 'components/ui/DataTable/DataTableInfinite'
import { DataTableSideBarLayout } from 'components/ui/DataTable/DataTableSideBarLayout'
import { DataTableToolbar } from 'components/ui/DataTable/DataTableToolbar'
import { FilterSideBar } from 'components/ui/DataTable/FilterSideBar'
import { LiveButton } from 'components/ui/DataTable/LiveButton'
import { LiveRow } from 'components/ui/DataTable/LiveRow'
import { DataTableProvider } from 'components/ui/DataTable/providers/DataTableProvider'
import { TimelineChart } from 'components/ui/DataTable/TimelineChart'
import { useUnifiedLogsChartQuery } from 'data/logs/unified-logs-chart-query'
import { useUnifiedLogsCountQuery } from 'data/logs/unified-logs-count-query'
import { useUnifiedLogsInfiniteQuery } from 'data/logs/unified-logs-infinite-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useQueryStates } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import {
  ChartConfig,
  cn,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Separator,
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
  const [search, setSearch] = useQueryStates(SEARCH_PARAMS_PARSER)

  const { sort, start, size, id, cursor, direction, live, ...filter } = search
  const defaultColumnSorting = sort ? [sort] : []
  const defaultColumnVisibility = { uuid: false }
  const defaultRowSelection = search.id ? { [search.id]: true } : {}
  const defaultColumnFilters = Object.entries(filter)
    .map(([key, value]) => ({ id: key, value }))
    .filter(({ value }) => value ?? undefined)

  const [topBarHeight, setTopBarHeight] = useState(0)

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
      // Don't clear rowSelection here - let it persist to maintain the selection
    } else if (!selectedRowId && search.id) {
      // Clear the URL parameter when no row is selected
      setSearch({ id: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, selectedRow, isLoading, isFetching])

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
        <ResizablePanelGroup direction="horizontal" autoSaveId="logs-layout">
          <FilterSideBar dateRangeDisabled={{ after: new Date() }} />
          <ResizableHandle
            withHandle
            // disabled={resizableSidebar ? false : true}
            className="group-data-[expanded=false]/controls:hidden hidden md:flex"
          />
          <ResizablePanel
            order={2}
            id="panel-right"
            className="flex max-w-full flex-1 flex-col overflow-hidden"
          >
            <DataTableHeaderLayout setTopBarHeight={setTopBarHeight}>
              <DataTableFilterCommand
                placeholder="Search logs..."
                searchParamsParser={SEARCH_PARAMS_PARSER}
              />
              <DataTableToolbar
                renderActions={() => [
                  <DownloadLogsButton key="download" searchParameters={searchParameters} />,
                  <RefreshButton
                    key="refresh"
                    isLoading={isRefetchingData}
                    onRefresh={refetchAllData}
                  />,
                  fetchPreviousPage ? (
                    <LiveButton
                      key="live"
                      fetchPreviousPage={fetchPreviousPage}
                      searchParamsParser={SEARCH_PARAMS_PARSER}
                    />
                  ) : null,
                ]}
              />
              <TimelineChart
                data={unifiedLogsChart}
                className={cn(
                  '-mb-2',
                  isFetchingCharts && 'opacity-60 transition-opacity duration-150'
                )}
                columnId="timestamp"
                chartConfig={filteredChartConfig}
              />
            </DataTableHeaderLayout>
            <Separator />
            <ResizablePanelGroup direction="horizontal" className="w-full h-full">
              <ResizablePanel
                defaultSize={selectedRowKey ? 60 : 100}
                minSize={30}
                className="h-full"
              >
                <ResizablePanelGroup key="main-logs" direction="vertical" className="h-full">
                  <ResizablePanel
                    defaultSize={100}
                    minSize={30}
                    className={cn(
                      'bg',
                      isFetchingButNotPaginating && 'opacity-60 transition-opacity duration-150'
                    )}
                  >
                    <div className="h-full overflow-auto">
                      <DataTableInfinite
                        columns={UNIFIED_LOGS_COLUMNS}
                        totalRows={totalDBRowCount}
                        filterRows={filterDBRowCount}
                        totalRowsFetched={totalFetched}
                        fetchNextPage={fetchNextPage}
                        hasNextPage={hasNextPage}
                        renderLiveRow={(props) => {
                          if (!liveMode.timestamp) return null
                          if (props?.row?.original.id !== liveMode?.row?.id) return null
                          return <LiveRow colSpan={UNIFIED_LOGS_COLUMNS.length - 1} />
                        }}
                        setColumnOrder={setColumnOrder}
                        setColumnVisibility={setColumnVisibility}
                        searchParamsParser={SEARCH_PARAMS_PARSER}
                      />
                    </div>
                  </ResizablePanel>
                  <LogsListPanel selectedRow={selectedRow} />
                </ResizablePanelGroup>
              </ResizablePanel>

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
