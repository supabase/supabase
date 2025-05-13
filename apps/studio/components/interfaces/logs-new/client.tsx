'use client'

import { useQueryState, useQueryStates } from 'nuqs'
import * as React from 'react'

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
  type Table as TTable,
} from '@tanstack/react-table'
import { DataTableInfinite } from 'components/interfaces/data-table/data-table-infinite'
import { TimelineChart } from 'components/interfaces/data-table/timeline-chart'
import { useHotKey } from 'components/interfaces/DataTableDemo/hooks/use-hot-key'
import { LiveRow } from 'components/interfaces/DataTableDemo/infinite/_components/live-row'

import {
  getLevelLabel,
  getLevelRowClassName,
} from 'components/interfaces/DataTableDemo/lib/request/level'
import { arrSome, inDateRange } from 'components/interfaces/DataTableDemo/lib/table/filterfns'
import { ChartConfig, cn, Separator } from 'ui'
import { DataTableFilterCommand } from 'components/interfaces/DataTableDemo/components/data-table/data-table-filter-command'
import {
  DataTableProvider,
  useDataTable,
} from 'components/interfaces/DataTableDemo/components/data-table/data-table-provider'
import { DataTableSheetDetails } from 'components/interfaces/DataTableDemo/components/data-table/data-table-sheet/data-table-sheet-details'
import { DataTableToolbar } from 'components/interfaces/DataTableDemo/components/data-table/data-table-toolbar'
import { useLocalStorage } from 'components/interfaces/DataTableDemo/hooks/use-local-storage'
import { LiveButton } from 'components/interfaces/DataTableDemo/infinite/_components/live-button'
import { RefreshButton } from 'components/interfaces/DataTableDemo/infinite/_components/refresh-button'
import { Percentile } from 'components/interfaces/DataTableDemo/lib/request/percentile'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from 'ui/src/components/shadcn/ui/resizable'
import { Button } from 'ui'
import { X } from 'lucide-react'

// components pulled out and modified
import { FilterSideBar } from '../data-table/filter-side-bar'
import { DataTableHeaderLayout } from '../data-table/data-table-header-layout'
import { DataTableSideBarLayout } from '../data-table/data-table-side-bar-layout'

// specific imports
import { MemoizedDataTableSheetContent } from './components/data-table-sheet-content'
import type { FacetMetadataSchema, TimelineChartSchema } from './schema'
import { columns, logEventBus } from './columns'
import { searchParamsParser } from './search-params'
import { dataOptions, useChartData } from './query-options-new'
import { filterFields as defaultFilterFields, sheetFields } from './constants'
import { useParams } from 'common'
import { TraceDetailTab } from './components/trace-detail-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'ui/src/components/shadcn/ui/tabs'
import { FunctionLogsTab } from './components/function-logs-tab'

// Debug mode flag - set to true to enable detailed logs
const DEBUG_FILTER_PROCESSING = false

function TooltipLabel({ level }: { level: keyof Omit<TimelineChartSchema, 'timestamp'> }) {
  return (
    <div className="mr-2 flex w-20 items-center justify-between gap-2 font-mono">
      <div className="capitalize text-foreground/70">{level}</div>
      <div className="text-xs text-muted-foreground/70">{getLevelLabel(level)}</div>
    </div>
  )
}

const chartConfig = {
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

export function Client() {
  const [search, setSearch] = useQueryStates(searchParamsParser)
  const { ref: projectRef } = useParams()
  const [activeTab, setActiveTab] = React.useState('details')

  const { data, isFetching, isLoading, fetchNextPage, hasNextPage, fetchPreviousPage, refetch } =
    useInfiniteQuery(dataOptions(search, projectRef ?? ''))

  // Add the chart data query for the entire time period
  const { data: chartDataResult, isLoading: isChartLoading } = useChartData(
    search,
    projectRef ?? ''
  )

  useResetFocus()

  const [topBarHeight, setTopBarHeight] = React.useState(0)

  const flatData = React.useMemo(() => {
    return data?.pages?.flatMap((page) => page.data ?? []) ?? []
  }, [data?.pages])

  const liveMode = useLiveMode(flatData)

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

  const { sort, start, size, uuid, cursor, direction, live, ...filter } = search

  // Create a filtered version of the chart config based on selected levels
  const filteredChartConfig = React.useMemo(() => {
    const levelFilter = search.level || ['success', 'warning', 'error']
    return Object.fromEntries(
      Object.entries(chartConfig).filter(([key]) => levelFilter.includes(key))
    ) as ChartConfig
  }, [search.level])

  const defaultColumnFilters = Object.entries(filter)
    .map(([key, value]) => ({
      id: key,
      value,
    }))
    .filter(({ value }) => value ?? undefined)

  const defaultColumnSorting = sort ? [sort] : []
  const defaultColumnVisibility = {
    uuid: false,
  }
  const defaultRowSelection = search.uuid ? { [search.uuid]: true } : {}

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(defaultColumnFilters)
  const [sorting, setSorting] = React.useState<SortingState>(defaultColumnSorting)
  const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(
    'data-table-visibility',
    defaultColumnVisibility
  )
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(defaultRowSelection)
  const [columnOrder, setColumnOrder] = useLocalStorage<string[]>('data-table-column-order', [])

  // REMINDER: this is currently needed for the cmdk search
  // TODO: auto search via API when the user changes the filter instead of hardcoded
  const filterFields = React.useMemo(() => {
    return defaultFilterFields.map((field) => {
      const facetsField = facets?.[field.value]
      if (!facetsField) return field
      if (field.options && field.options.length > 0) return field

      // REMINDER: if no options are set, we need to set them via the API
      const options = facetsField.rows.map(({ value }) => {
        return {
          label: `${value}`,
          value,
        }
      })

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

  const getRowClassName = <TData extends { date: Date; level: string; timestamp: number }>(
    row: Row<TData>
  ) => {
    const rowTimestamp = row.original.timestamp
    const isPast = rowTimestamp <= (liveMode.timestamp || -1)
    const levelClassName = getLevelRowClassName(row.original.level)
    return cn(levelClassName, isPast ? 'opacity-50' : 'opacity-100')
  }

  const table = useReactTable({
    data: flatData,
    columns,
    state: {
      columnFilters,
      sorting,
      columnVisibility,
      rowSelection,
      columnOrder,
    },
    enableMultiRowSelection: false,
    columnResizeMode: 'onChange',
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
    filterFns: { inDateRange, arrSome },
    // Here, manually override the filter function for the level column
    // to prevent client-side filtering since it's already filtered on the server
    columnFilterFns: {
      level: () => true, // Always return true to pass all level values
    },
    // debugAll: process.env.NEXT_PUBLIC_TABLE_DEBUG === 'true',
    meta: { getRowClassName },
  })

  const selectedRow = React.useMemo(() => {
    if ((isLoading || isFetching) && !flatData.length) return
    const selectedRowKey = Object.keys(rowSelection)?.[0]
    return table.getCoreRowModel().flatRows.find((row) => row.id === selectedRowKey)
  }, [rowSelection, table, isLoading, isFetching, flatData])

  const selectedRowKey = Object.keys(rowSelection)?.[0]

  React.useEffect(() => {
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

  React.useEffect(() => {
    setSearch({ sort: sorting?.[0] || null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting])

  // TODO: can only share uuid within the first batch
  React.useEffect(() => {
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
  React.useEffect(() => {
    const unsubscribe = logEventBus.on('selectTraceTab', (rowId) => {
      // Select the row
      setRowSelection({ [rowId]: true })
      // Set the active tab to trace
      setActiveTab('trace')
    })

    return () => {
      unsubscribe()
    }
  }, [setRowSelection])

  return (
    <>
      <DataTableProvider
        table={table}
        columns={columns}
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
              <DataTableFilterCommand searchParamsParser={searchParamsParser} />
              <DataTableToolbar
                renderActions={() => [
                  <RefreshButton key="refresh" onClick={refetch} />,
                  fetchPreviousPage ? (
                    <LiveButton key="live" fetchPreviousPage={fetchPreviousPage} />
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
            {/* Use ResizablePanelGroup for the log list and details */}
            {/* <div className="flex flex-1 overflow-hidden"> */}
            <ResizablePanelGroup direction="horizontal" className="w-full h-full">
              <ResizablePanel
                defaultSize={selectedRowKey ? 60 : 100}
                minSize={30}
                className="h-full"
              >
                <ResizablePanelGroup key="main-logs" direction="vertical" className="h-full">
                  <ResizablePanel defaultSize={100} minSize={30}>
                    <div className="h-full overflow-auto">
                      <DataTableInfinite
                        columns={columns}
                        totalRows={totalDBRowCount}
                        filterRows={filterDBRowCount}
                        totalRowsFetched={totalFetched}
                        isFetching={isFetching}
                        isLoading={isLoading}
                        fetchNextPage={fetchNextPage}
                        hasNextPage={hasNextPage}
                        renderLiveRow={(props) => {
                          if (!liveMode.timestamp) return null
                          if (props?.row.original.uuid !== liveMode?.row?.uuid) return null
                          return <LiveRow />
                        }}
                        setColumnOrder={setColumnOrder}
                        setColumnVisibility={setColumnVisibility}
                      />
                    </div>
                  </ResizablePanel>
                  {/* <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={20} minSize={20} className="bg">
                    hello world
                    <pre className="text-xs p-2">
                      {JSON.stringify(selectedRow?.original, null, 2)}
                    </pre>
                  </ResizablePanel> */}
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
                  <ResizablePanel defaultSize={25} minSize={25}>
                    <ResizablePanelGroup direction="vertical">
                      <ResizablePanel defaultSize={100} minSize={30}>
                        <div className="h-full overflow-auto">
                          <DataTableSheetDetails
                            title={selectedRow?.original?.pathname}
                            titleClassName="font-mono"
                          >
                            <Tabs
                              defaultValue="details"
                              value={activeTab}
                              onValueChange={setActiveTab}
                              className="w-full h-full flex flex-col pt-4"
                            >
                              <TabsList className="mb-2 flex gap-3 px-5">
                                <TabsTrigger value="details">Log Details</TabsTrigger>
                                <TabsTrigger value="trace">Trace</TabsTrigger>
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

                              <TabsContent
                                value="trace"
                                className="flex-grow overflow-auto data-[state=active]:flex-grow h-full mt-0 px-5"
                              >
                                {selectedRow?.original?.has_trace ? (
                                  <TraceDetailTab id={selectedRow?.original?.id} />
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    <p className="text-sm text-muted-foreground">
                                      No trace found for this log
                                    </p>
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>
                          </DataTableSheetDetails>
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </div>
          {/* </div> */}
        </DataTableSideBarLayout>
      </DataTableProvider>
    </>
  )
}

function useResetFocus() {
  useHotKey(() => {
    // FIXME: some dedicated div[tabindex="0"] do not auto-unblur (e.g. the DataTableFilterResetButton)
    // REMINDER: we cannot just document.activeElement?.blur(); as the next tab will focus the next element in line,
    // which is not what we want. We want to reset entirely.
    document.body.setAttribute('tabindex', '0')
    document.body.focus()
    document.body.removeAttribute('tabindex')
  }, '.')
}

// TODO: make a BaseObject (incl. date and uuid e.g. for every upcoming branch of infinite table)
export function useLiveMode<TData extends { date: Date }>(data: TData[]) {
  const [live] = useQueryState('live', searchParamsParser.live)
  // REMINDER: used to capture the live mode on timestamp
  const liveTimestamp = React.useRef<number | undefined>(live ? new Date().getTime() : undefined)

  React.useEffect(() => {
    if (live) liveTimestamp.current = new Date().getTime()
    else liveTimestamp.current = undefined
  }, [live])

  const anchorRow = React.useMemo(() => {
    if (!live) return undefined

    const item = data.find((item) => {
      // return first item that is there if not liveTimestamp
      if (!liveTimestamp.current) return true
      // return first item that is after the liveTimestamp
      if (item.date.getTime() > liveTimestamp.current) return false
      return true
      // return first item if no liveTimestamp
    })

    return item
  }, [live, data])

  return { row: anchorRow, timestamp: liveTimestamp.current }
}

export function getFacetedUniqueValues<TData>(facets?: Record<string, FacetMetadataSchema>) {
  return (table: TTable<TData>, columnId: string) => {
    return new Map(facets?.[columnId]?.rows?.map(({ value, total }) => [value, total]) || [])
  }
}

export function getFacetedMinMaxValues<TData>(facets?: Record<string, FacetMetadataSchema>) {
  return (table: TTable<TData>, columnId: string) => {
    const min = facets?.[columnId]?.min
    const max = facets?.[columnId]?.max
    if (typeof min === 'number' && typeof max === 'number') return [min, max]
    if (typeof min === 'number') return [min, min]
    if (typeof max === 'number') return [max, max]
    return undefined
  }
}
