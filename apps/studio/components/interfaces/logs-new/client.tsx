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
import { ChartConfig, cn } from 'ui'
import { DataTableFilterCommand } from 'components/interfaces/DataTableDemo/components/data-table/data-table-filter-command'
import { DataTableProvider } from 'components/interfaces/DataTableDemo/components/data-table/data-table-provider'
import { DataTableSheetDetails } from 'components/interfaces/DataTableDemo/components/data-table/data-table-sheet/data-table-sheet-details'
import { DataTableToolbar } from 'components/interfaces/DataTableDemo/components/data-table/data-table-toolbar'
import { useLocalStorage } from 'components/interfaces/DataTableDemo/hooks/use-local-storage'
import { LiveButton } from 'components/interfaces/DataTableDemo/infinite/_components/live-button'
import { RefreshButton } from 'components/interfaces/DataTableDemo/infinite/_components/refresh-button'
import { Percentile } from 'components/interfaces/DataTableDemo/lib/request/percentile'

// components pulled out and modified
import { FilterSideBar } from '../data-table/filter-side-bar'
import { DataTableHeaderLayout } from '../data-table/data-table-header-layout'
import { DataTableSideBarLayout } from '../data-table/data-table-side-bar-layout'

// specific imports
import { MemoizedDataTableSheetContent } from './components/data-table-sheet-content'
import type { FacetMetadataSchema, TimelineChartSchema } from './schema'
import { columns } from './columns'
import { searchParamsParser } from './search-params'
import { dataOptions, useChartData } from './query-options-new'
import { filterFields as defaultFilterFields, sheetFields } from './constants'
import { useParams } from 'common'

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

  const { data, isFetching, isLoading, fetchNextPage, hasNextPage, fetchPreviousPage, refetch } =
    useInfiniteQuery(dataOptions(search, projectRef ?? ''))

  // Add the chart data query for the entire time period
  const { data: chartDataResult, isLoading: isChartLoading } = useChartData(
    search,
    projectRef ?? ''
  )

  console.log('>>> [Client] chartDataResult:', chartDataResult)

  useResetFocus()

  const [topBarHeight, setTopBarHeight] = React.useState(0)

  const flatData = React.useMemo(
    () => data?.pages?.flatMap((page) => page.data ?? []) ?? [],
    [data?.pages]
  )

  const liveMode = useLiveMode(flatData)

  // REMINDER: meta data is always the same for all pages as filters do not change(!)
  const lastPage = data?.pages?.[data?.pages.length - 1]
  const totalDBRowCount = lastPage?.meta?.totalRowCount
  const filterDBRowCount = lastPage?.meta?.filterRowCount
  const metadata = lastPage?.meta?.metadata
  // Use chart data from the separate query if available, fallback to the default
  const chartData = chartDataResult?.chartData || lastPage?.meta?.chartData
  const facets = lastPage?.meta?.facets
  const totalFetched = flatData?.length

  const { sort, start, size, uuid, cursor, direction, live, ...filter } = search

  const defaultColumnFilters = Object.entries(filter)
    .map(([key, value]) => ({
      id: key,
      value,
    }))
    .filter(({ value }) => value ?? undefined)

  const defaultColumnSorting = sort ? [sort] : []
  const defaultColumnVisibility = {
    uuid: false,
    // Remove timing fields since they don't exist in schema anymore
    // 'timing.dns': false,
    // 'timing.connection': false,
    // 'timing.tls': false,
    // 'timing.ttfb': false,
    // 'timing.transfer': false,
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

      if (field.type === 'slider') {
        return {
          ...field,
          min: facetsField.min ?? field.min,
          max: facetsField.max ?? field.max,
          options,
        }
      }

      return { ...field, options }
    })
  }, [facets])

  // --- DEBUG: Check props before passing to DataTableInfinite ---
  // console.log('>>> [Client] flatData length:', flatData?.length)
  // console.log('>>> [Client] filterDBRowCount:', filterDBRowCount)
  // console.log('>>> [Client] data object:', data) // Log the raw react-query data
  // --- END DEBUG ---

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
    getFacetedUniqueValues: getFacetedUniqueValues(facets),
    getFacetedMinMaxValues: getFacetedMinMaxValues(facets),
    filterFns: { inDateRange, arrSome },
    debugAll: process.env.NEXT_PUBLIC_TABLE_DEBUG === 'true',
    meta: { getRowClassName },
  })

  const selectedRow = React.useMemo(() => {
    if ((isLoading || isFetching) && !flatData.length) return
    const selectedRowKey = Object.keys(rowSelection)?.[0]
    return table.getCoreRowModel().flatRows.find((row) => row.id === selectedRowKey)
  }, [rowSelection, table, isLoading, isFetching, flatData])

  React.useEffect(() => {
    const columnFiltersWithNullable = filterFields.map((field) => {
      const filterValue = columnFilters.find((filter) => filter.id === field.value)
      if (!filterValue) return { id: field.value, value: null }
      return { id: field.value, value: filterValue.value }
    })

    const search = columnFiltersWithNullable.reduce(
      (prev, curr) => {
        prev[curr.id as string] = curr.value
        return prev
      },
      {} as Record<string, unknown>
    )

    setSearch(search)
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
        getFacetedMinMaxValues={getFacetedMinMaxValues(facets)}
      >
        <DataTableSideBarLayout topBarHeight={topBarHeight}>
          <FilterSideBar />
          <div
            className={cn(
              'flex max-w-full flex-1 flex-col border-border sm:border-l',
              // Chrome issue
              'group-data-[expanded=true]/controls:sm:max-w-[calc(100vw_-_208px)] group-data-[expanded=true]/controls:md:max-w-[calc(100vw_-_288px)]'
            )}
          >
            <DataTableHeaderLayout setTopBarHeight={setTopBarHeight}>
              <DataTableFilterCommand searchParamsParser={searchParamsParser} />
              {/* TBD: better flexibility with compound components? */}
              <DataTableToolbar
                renderActions={() => [
                  <RefreshButton key="refresh" onClick={refetch} />,
                  fetchPreviousPage ? (
                    <LiveButton key="live" fetchPreviousPage={fetchPreviousPage} />
                  ) : null,
                ]}
              />
              <div className="px-4 text-xs text-muted-foreground mb-1">
                Last hour of logs {search.date ? '(custom time range)' : '(default)'}
              </div>
              <TimelineChart
                data={chartData ?? []}
                className="-mb-2"
                columnId={'date'}
                chartConfig={chartConfig}
              />
            </DataTableHeaderLayout>
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
          <DataTableSheetDetails title={selectedRow?.original?.pathname} titleClassName="font-mono">
            <MemoizedDataTableSheetContent
              table={table}
              data={selectedRow?.original}
              filterFields={filterFields}
              fields={sheetFields}
              // TODO: check if we should memoize this
              // REMINDER: this is used to pass additional data like the `InfiniteQueryMeta`
              metadata={{
                totalRows: totalDBRowCount ?? 0,
                filterRows: filterDBRowCount ?? 0,
                totalRowsFetched: totalFetched ?? 0,
                currentPercentiles:
                  metadata?.currentPercentiles ?? ({} as Record<Percentile, number>),
                // REMINDER: includes `currentPercentiles`
                ...metadata,
              }}
            />
          </DataTableSheetDetails>
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
  return (_: TTable<TData>, columnId: string): Map<string, number> => {
    return new Map(facets?.[columnId]?.rows?.map(({ value, total }) => [value, total]) || [])
  }
}

export function getFacetedMinMaxValues<TData>(facets?: Record<string, FacetMetadataSchema>) {
  return (_: TTable<TData>, columnId: string): [number, number] | undefined => {
    const min = facets?.[columnId]?.min
    const max = facets?.[columnId]?.max
    if (typeof min === 'number' && typeof max === 'number') return [min, max]
    if (typeof min === 'number') return [min, min]
    if (typeof max === 'number') return [max, max]
    return undefined
  }
}
