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
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { useQueryStates } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import { arrSome, inDateRange } from 'components/ui/DataTable/DataTable.utils'
import { DataTableFilterCommand } from 'components/ui/DataTable/DataTableFilters/DataTableFilterCommand'
import { DataTableHeaderLayout } from 'components/ui/DataTable/DataTableHeaderLayout'
import { DataTableInfinite } from 'components/ui/DataTable/DataTableInfinite'
import { DataTableSheetDetails } from 'components/ui/DataTable/DataTableSheetDetails'
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
import {
  ChartConfig,
  cn,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Separator,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'
import { RefreshButton } from '../../ui/DataTable/RefreshButton'
import { UNIFIED_LOGS_COLUMNS } from './components/Columns'
import { MemoizedDataTableSheetContent } from './components/DataTableSheetContent'
import { FunctionLogsTab } from './components/FunctionLogsTab'
import { CHART_CONFIG, SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import { filterFields as defaultFilterFields, sheetFields } from './UnifiedLogs.fields'
import { useLiveMode, useResetFocus } from './UnifiedLogs.hooks'
import { QuerySearchParamsType } from './UnifiedLogs.types'
import { getFacetedUniqueValues, getLevelRowClassName, logEventBus } from './UnifiedLogs.utils'

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
  const [activeTab, setActiveTab] = useState('details')
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
  const searchParameters = Object.entries(search).reduce(
    (acc, [key, value]) => {
      if (!['id', 'live'].includes(key) && value !== null && value !== undefined) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, any>
  ) as QuerySearchParamsType

  const {
    data: unifiedLogsData,
    isLoading,
    isFetching,
    hasNextPage,
    refetch: refetchLogs,
    fetchNextPage,
    fetchPreviousPage,
  } = useUnifiedLogsInfiniteQuery({ projectRef, search: searchParameters })
  const {
    data: counts,
    isLoading: isLoadingCounts,
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

  const table = useReactTable({
    data: flatData,
    columns: UNIFIED_LOGS_COLUMNS,
    state: {
      columnFilters,
      sorting,
      columnVisibility,
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

  const selectedRow = useMemo(() => {
    if ((isLoading || isFetching) && !flatData.length) return
    const selectedRowKey = Object.keys(rowSelection)?.[0]
    return table.getCoreRowModel().flatRows.find((row) => row.id === selectedRowKey)
  }, [rowSelection, flatData])

  const selectedRowKey = Object.keys(rowSelection)?.[0]

  // REMINDER: this is currently needed for the cmdk search
  // TODO: auto search via API when the user changes the filter instead of hardcoded
  const filterFields = useMemo(() => {
    return defaultFilterFields.map((field) => {
      const facetsField = facets?.[field.value]
      if (!facetsField) return field
      if (field.options && field.options.length > 0) return field

      // REMINDER: if no options are set, we need to set them via the API
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

  useEffect(() => {
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters])

  useEffect(() => {
    setSearch({ sort: sorting?.[0] || null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting])

  useEffect(() => {
    if (isLoading || isFetching) return
    if (Object.keys(rowSelection)?.length && !selectedRow) {
      setSearch({ id: null })
      setRowSelection({})
    } else {
      setSearch({ id: Object.keys(rowSelection)?.[0] || null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, selectedRow, isLoading, isFetching])

  // Set up event listener for trace tab selection
  useEffect(() => {
    const unsubscribe = logEventBus.on('selectTraceTab', (rowId) => {
      setRowSelection({ [rowId]: true })
      setActiveTab('trace')
    })
    return () => {
      unsubscribe()
    }
  }, [setRowSelection])

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
      enableColumnOrdering={true}
      isFetching={isFetching}
      isLoading={isLoading}
      isLoadingCounts={isLoadingCounts}
      getFacetedUniqueValues={getFacetedUniqueValues(facets)}
    >
      <DataTableSideBarLayout topBarHeight={topBarHeight}>
        <FilterSideBar />
        <div className="flex max-w-full flex-1 flex-col border-border sm:border-l overflow-hidden">
          <DataTableHeaderLayout setTopBarHeight={setTopBarHeight}>
            <DataTableFilterCommand
              placeholder="Search logs..."
              searchParamsParser={SEARCH_PARAMS_PARSER}
            />
            <DataTableToolbar
              renderActions={() => [
                <RefreshButton isLoading={isRefetchingData} onRefresh={refetchAllData} />,
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
              className="-mb-2"
              columnId="timestamp"
              chartConfig={filteredChartConfig}
            />
          </DataTableHeaderLayout>

          <Separator />

          <ResizablePanelGroup direction="horizontal" className="w-full h-full">
            <ResizablePanel defaultSize={selectedRowKey ? 60 : 100} minSize={30} className="h-full">
              <ResizablePanelGroup key="main-logs" direction="vertical" className="h-full">
                <ResizablePanel defaultSize={100} minSize={30}>
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
                </ResizablePanel>
                {selectedRow?.original?.logs && selectedRow?.original?.logs?.length > 0 && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={20} minSize={20}>
                      <div className="h-full flex flex-col overflow-hidden">
                        <div className="px-5 py-3 border-b border-border flex justify-between items-center">
                          <h3 className="text-sm font-medium">
                            Function Logs (
                            {selectedRow?.original?.logs &&
                            Array.isArray(selectedRow?.original?.logs)
                              ? selectedRow?.original?.logs?.length
                              : 0}
                            )
                          </h3>
                        </div>
                        <div className="flex-grow overflow-auto">
                          <FunctionLogsTab logs={selectedRow?.original?.logs} />
                        </div>
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>

            {selectedRowKey && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={45} minSize={45}>
                  <div className="h-full overflow-auto">
                    <DataTableSheetDetails
                      title={selectedRow?.original?.pathname}
                      titleClassName="font-mono text-sm"
                    >
                      <Tabs
                        defaultValue="details"
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full h-full flex flex-col pt-2"
                      >
                        <TabsList className="flex gap-3 px-5">
                          <TabsTrigger value="details">Log Details</TabsTrigger>
                        </TabsList>

                        <TabsContent
                          value="details"
                          className="flex-grow overflow-auto data-[state=active]:flex-grow px-5"
                        >
                          <MemoizedDataTableSheetContent
                            table={table}
                            data={selectedRow?.original}
                            filterFields={filterFields}
                            fields={sheetFields}
                            metadata={{
                              totalRows: totalDBRowCount ?? 0,
                              filterRows: filterDBRowCount ?? 0,
                              totalRowsFetched: totalFetched ?? 0,
                              currentPercentiles: {} as any,
                            }}
                          />
                        </TabsContent>
                      </Tabs>
                    </DataTableSheetDetails>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </DataTableSideBarLayout>
    </DataTableProvider>
  )
}
