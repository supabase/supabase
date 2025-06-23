import { useInfiniteQuery } from '@tanstack/react-query'
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
import { RefreshButton } from 'components/ui/DataTable/RefreshButton'
import { TimelineChart } from 'components/ui/DataTable/TimelineChart'
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
import { COLUMNS } from './components/Columns'
import { MemoizedDataTableSheetContent } from './components/DataTableSheetContent'
import { FunctionLogsTab } from './components/FunctionLogsTab'
import { dataOptions, useChartData } from './QueryOptions'
import { CHART_CONFIG, SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import { filterFields as defaultFilterFields, sheetFields } from './UnifiedLogs.fields'
import { useLiveMode, useResetFocus } from './UnifiedLogs.hooks'
import { getFacetedUniqueValues, getLevelRowClassName, logEventBus } from './UnifiedLogs.utils'

// Debug mode flag - set to true to enable detailed logs
const DEBUG_FILTER_PROCESSING = false

export const UnifiedLogs = () => {
  useResetFocus()

  const { ref: projectRef } = useParams()
  const [search, setSearch] = useQueryStates(SEARCH_PARAMS_PARSER)

  const { sort, start, size, uuid, cursor, direction, live, ...filter } = search
  const defaultColumnSorting = sort ? [sort] : []
  const defaultColumnVisibility = { uuid: false }
  const defaultRowSelection = search.uuid ? { [search.uuid]: true } : {}
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

  // [Joshen] This needs to move to the data folder to follow our proper RQ structure
  const { data, isFetching, isLoading, fetchNextPage, hasNextPage, fetchPreviousPage, refetch } =
    // @ts-ignore
    useInfiniteQuery(dataOptions(search, projectRef ?? ''))

  const flatData = useMemo(() => {
    return data?.pages?.flatMap((page) => page.data ?? []) ?? []
  }, [data?.pages])
  const liveMode = useLiveMode(flatData)

  // Add the chart data query for the entire time period
  const { data: chartDataResult } = useChartData(search, projectRef ?? '')

  // REMINDER: meta data is always the same for all pages as filters do not change(!)
  const lastPage = data?.pages?.[data?.pages.length - 1]
  // Use the totalCount from chartDataResult which gives us the actual count of logs in the time period
  // instead of the hardcoded 10000 value
  const totalDBRowCount = chartDataResult?.totalCount || lastPage?.meta?.totalRowCount
  const filterDBRowCount = lastPage?.meta?.filterRowCount
  const metadata = lastPage?.meta?.metadata
  // Use chart data from the separate query if available, fallback to the default
  const chartData = chartDataResult?.chartData || lastPage?.meta?.chartData
  const facets = lastPage?.meta?.facets
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
    return cn(levelClassName, isPast ? 'opacity-50' : 'opacity-100')
  }

  const table = useReactTable({
    data: flatData,
    columns: COLUMNS,
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
    getRowId: (row) => row.uuid,
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
    // Here, manually override the filter function for the level column
    // to prevent client-side filtering since it's already filtered on the server
    // Always return true to pass all level values
    // columnFilterFns: { level: () => true },
    // debugAll: process.env.NEXT_PUBLIC_TABLE_DEBUG === 'true',
  })

  const selectedRow = useMemo(() => {
    if ((isLoading || isFetching) && !flatData.length) return
    const selectedRowKey = Object.keys(rowSelection)?.[0]
    return table.getCoreRowModel().flatRows.find((row) => row.id === selectedRowKey)
  }, [rowSelection, table, isLoading, isFetching, flatData])

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
    if (DEBUG_FILTER_PROCESSING) console.log('========== FILTER CHANGE DETECTED ==========')
    if (DEBUG_FILTER_PROCESSING) console.log('Raw columnFilters:', JSON.stringify(columnFilters))

    // Check for level filters specifically
    const levelColumnFilter = columnFilters.find((filter) => filter.id === 'level')
    if (DEBUG_FILTER_PROCESSING) console.log('Level column filter:', levelColumnFilter)

    const columnFiltersWithNullable = filterFields.map((field) => {
      const filterValue = columnFilters.find((filter) => filter.id === field.value)
      if (DEBUG_FILTER_PROCESSING) console.log(`Processing field ${field.value}:`, filterValue)
      if (!filterValue) return { id: field.value, value: null }
      return { id: field.value, value: filterValue.value }
    })

    // Debug level filter specifically
    const levelFilter = columnFiltersWithNullable.find((f) => f.id === 'level')
    if (DEBUG_FILTER_PROCESSING) console.log('Level filter after mapping:', levelFilter)

    if (DEBUG_FILTER_PROCESSING)
      console.log('All column filters after mapping:', columnFiltersWithNullable)

    const search = columnFiltersWithNullable.reduce(
      (prev, curr) => {
        if (DEBUG_FILTER_PROCESSING)
          console.log(`Processing filter for URL: ${curr.id}`, {
            value: curr.value,
            type: Array.isArray(curr.value) ? 'array' : typeof curr.value,
            isEmpty: Array.isArray(curr.value) && curr.value.length === 0,
            isNull: curr.value === null,
          })

        // Add to search parameters
        prev[curr.id as string] = curr.value
        return prev
      },
      {} as Record<string, unknown>
    )

    if (DEBUG_FILTER_PROCESSING) console.log('Final search object to be set in URL:', search)
    if (DEBUG_FILTER_PROCESSING) console.log('Level value in final search:', search.level)
    if (DEBUG_FILTER_PROCESSING) console.log('Is level in search object:', 'level' in search)

    // Set the search state without any console logs
    if (DEBUG_FILTER_PROCESSING) console.log('CALLING setSearch with:', JSON.stringify(search))
    setSearch(search)
    if (DEBUG_FILTER_PROCESSING) console.log('========== END FILTER PROCESSING ==========')

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters])

  useEffect(() => {
    setSearch({ sort: sorting?.[0] || null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting])

  // TODO: can only share uuid within the first batch
  useEffect(() => {
    if (isLoading || isFetching) return
    if (Object.keys(rowSelection)?.length && !selectedRow) {
      setSearch({ uuid: null })
      setRowSelection({})
    } else {
      setSearch({ uuid: Object.keys(rowSelection)?.[0] || null })
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
      columns={COLUMNS}
      filterFields={filterFields}
      columnFilters={columnFilters}
      sorting={sorting}
      rowSelection={rowSelection}
      columnOrder={columnOrder}
      columnVisibility={columnVisibility}
      enableColumnOrdering={true}
      isLoading={isFetching || isLoading}
      getFacetedUniqueValues={getFacetedUniqueValues(facets)}
      // getFacetedMinMaxValues={getFacetedMinMaxValues(facets)}
    >
      <DataTableSideBarLayout topBarHeight={topBarHeight}>
        <FilterSideBar />
        <div className="flex max-w-full flex-1 flex-col border-border sm:border-l overflow-hidden">
          <DataTableHeaderLayout setTopBarHeight={setTopBarHeight}>
            <DataTableFilterCommand searchParamsParser={SEARCH_PARAMS_PARSER} />
            <DataTableToolbar
              renderActions={() => [
                <RefreshButton key="refresh" onClick={refetch} />,
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
              data={chartData ?? []}
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
                  <div className="h-full overflow-auto">
                    <DataTableInfinite
                      columns={COLUMNS}
                      totalRows={totalDBRowCount}
                      filterRows={filterDBRowCount}
                      totalRowsFetched={totalFetched}
                      isFetching={isFetching}
                      isLoading={isLoading}
                      fetchNextPage={fetchNextPage}
                      hasNextPage={hasNextPage}
                      renderLiveRow={(props) => {
                        if (!liveMode.timestamp) return null
                        if ((props?.row as any).original.uuid !== liveMode?.row?.uuid) return null
                        return <LiveRow colSpan={COLUMNS.length - 1} />
                      }}
                      setColumnOrder={setColumnOrder}
                      setColumnVisibility={setColumnVisibility}
                      searchParamsParser={SEARCH_PARAMS_PARSER}
                    />
                  </div>
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
                              currentPercentiles: metadata?.currentPercentiles ?? ({} as any),
                              ...metadata,
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
