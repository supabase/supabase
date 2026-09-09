import {
  ColumnFiltersState,
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  getFacetedMinMaxValues as getTTableFacetedMinMaxValues,
  getFacetedUniqueValues as getTTableFacetedUniqueValues,
  Row,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createSerializer, useQueryStates } from 'nuqs'
import { useMemo, useState } from 'react'
import { Button, cn, ResizablePanel, ResizablePanelGroup } from 'ui'

import { WorkerCommandLine } from '../WorkerCommandLine'
import { buildWorkerLogsColumnFilters, buildWorkerLogsSearchParameters } from '../Workers.utils'
import { WorkerLogStreamToggle } from './WorkerLogStreamToggle'
import {
  generateDynamicColumns,
  UNIFIED_LOGS_COLUMNS,
} from '@/components/interfaces/UnifiedLogs/components/Columns'
import { DownloadLogsButton } from '@/components/interfaces/UnifiedLogs/components/DownloadLogsButton'
import { LogsFilterBar } from '@/components/interfaces/UnifiedLogs/components/LogsFilterBar'
import { ServiceFlowPanel } from '@/components/interfaces/UnifiedLogs/ServiceFlowPanel'
import { CHART_CONFIG } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.chart-config'
import { SEARCH_PARAMS_PARSER } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import { filterFields as defaultFilterFields } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.fields'
import { buildFilterSearchUpdate } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.filters'
import {
  useFilterSearchSync,
  useLiveMode,
  useUnifiedLogsData,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.hooks'
import { ColumnSchema } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.schema'
import {
  getFacetedUniqueValues,
  getLevelRowClassName,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { arrSome, inDateRange } from '@/components/ui/DataTable/DataTable.utils'
import { DataTableFilterTimerange } from '@/components/ui/DataTable/DataTableFilters/DataTableFilterTimerange'
import { DataTableInfinite } from '@/components/ui/DataTable/DataTableInfinite'
import { LiveButton } from '@/components/ui/DataTable/LiveButton'
import { DataTableProvider } from '@/components/ui/DataTable/providers/DataTableProvider'
import { RefreshButton } from '@/components/ui/DataTable/RefreshButton'
import { TimelineChart } from '@/components/ui/DataTable/TimelineChart'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { CLI_NAME } from '@/lib/constants/workers'

interface WorkerLogsTabProps {
  workerName: string
}

// This tab is scoped to one worker, so the Log Type facet has nothing to choose
// from, and worker rows never carry an HTTP method / status / pathname. Only the
// filters that can actually narrow the rows are kept.
const WORKER_FILTER_FIELD_VALUES = new Set(['date', 'level', 'event_message'])
const WORKER_FILTER_FIELDS = defaultFilterFields.filter((field) =>
  WORKER_FILTER_FIELD_VALUES.has(field.value)
)

// No row selection here — bulk actions belong to the full Logs page.
const DEFAULT_COLUMN_VISIBILITY: VisibilityState = { select: false }

const serializeLogsSearch = createSerializer(SEARCH_PARAMS_PARSER)

// Worker logs only exist on the OTEL endpoint; the BigQuery path has no worker
// sources, so the `otelUnifiedLogs` flag must not route this tab there.
const USE_OTEL = true

export const WorkerLogsTab = ({ workerName }: WorkerLogsTabProps) => {
  const { ref: projectRef } = useParams()
  const [search, setSearch] = useQueryStates(SEARCH_PARAMS_PARSER)

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() =>
    buildWorkerLogsColumnFilters(search)
  )
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [dock, setDock] = useLocalStorageQuery<'bottom' | 'right'>(
    LOCAL_STORAGE_KEYS.UNIFIED_LOGS_DOCK,
    'bottom'
  )

  // Always scoped to this worker, whatever the URL says — see buildWorkerLogsSearchParameters.
  const searchParameters = useMemo(
    () => buildWorkerLogsSearchParameters(search, workerName, columnFilters),
    [search, workerName, columnFilters]
  )

  const {
    flatData,
    error,
    isError,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    hasNextPage,
    fetchNextPage,
    fetchPreviousPage,
    totalRowCount,
    facets,
    isLoadingCounts,
    chartData,
    isFetchingChart,
    refetchAll,
    isRefetching,
  } = useUnifiedLogsData({ projectRef, search: searchParameters, useOtel: USE_OTEL })

  const liveMode = useLiveMode(flatData)

  // Only fade when filtering (not when loading more data or live mode)
  const isFetchingButNotPaginating = isFetching && !isFetchingNextPage && !isFetchingPreviousPage

  const getRowClassName = (row: Row<ColumnSchema>) => {
    const isPast = row.original.timestamp <= (liveMode.timestamp || -1)
    return cn(
      getLevelRowClassName(row.original.level),
      isPast ? 'opacity-50' : 'opacity-100',
      'h-[30px]'
    )
  }

  const { columns: dynamicColumns, columnVisibility: dynamicColumnVisibility } = useMemo(() => {
    return generateDynamicColumns({ data: flatData })
  }, [flatData])

  const table = useReactTable<ColumnSchema>({
    data: flatData,
    columns: dynamicColumns,
    state: {
      columnFilters,
      columnVisibility: { ...dynamicColumnVisibility, ...columnVisibility },
      columnOrder,
    },
    columnResizeMode: 'onChange',
    filterFns: { inDateRange, arrSome },
    meta: { getRowClassName },
    getRowId: (row) => row.id,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getTTableFacetedUniqueValues(),
    getFacetedMinMaxValues: getTTableFacetedMinMaxValues(),
  })

  // The open row lives in the URL (`id`), like on the Logs page, so a log can be
  // shared and reopened by link.
  const openRowId = search.id ?? undefined
  const setOpenRowId = (id: string | undefined) => setSearch({ id: id ?? null })
  const selectedRow = table.getCoreRowModel().flatRows.find((row) => row.id === openRowId)

  const applyFilterSearch = () => {
    setSearch(buildFilterSearchUpdate(columnFilters, WORKER_FILTER_FIELDS))
  }

  useFilterSearchSync({ applyFilterSearch, columnFilters, enabled: true })

  if (!projectRef) return null

  // Hands the exact same scope (worker, streams, filters, time range, open row)
  // over to the full Logs page.
  const openInLogsUrl = serializeLogsSearch(`/project/${projectRef}/logs`, {
    ...searchParameters,
    id: openRowId ?? null,
  })

  return (
    <DataTableProvider
      table={table}
      error={error}
      columns={UNIFIED_LOGS_COLUMNS}
      filterFields={WORKER_FILTER_FIELDS}
      columnFilters={columnFilters}
      openRowId={openRowId}
      setOpenRowId={setOpenRowId}
      columnOrder={columnOrder}
      columnVisibility={columnVisibility}
      searchParameters={searchParameters}
      isFetching={isFetching}
      isError={isError}
      isLoading={isLoading}
      isLoadingCounts={isLoadingCounts}
      getFacetedUniqueValues={getFacetedUniqueValues(facets)}
    >
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex flex-wrap items-center gap-2 border-b px-2 py-2">
          <div className="w-full sm:w-auto">
            <DataTableFilterTimerange label="Time Range" value="date" type="timerange" />
          </div>
          <div className="order-first w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
            <LogsFilterBar />
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-x-2 gap-y-2">
            <WorkerLogStreamToggle />
            <RefreshButton isLoading={isRefetching} onRefresh={refetchAll} />
            <DownloadLogsButton searchParameters={searchParameters} useOtel={USE_OTEL} />
            <LiveButton
              fetchPreviousPage={fetchPreviousPage}
              searchParamsParser={SEARCH_PARAMS_PARSER}
            />
            <Button asChild size="tiny" variant="default" icon={<ArrowUpRight />}>
              <Link href={openInLogsUrl}>Open in Logs</Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-[60px] flex items-center justify-center">
            <Loader2 size={14} className="animate-spin text-foreground-lighter" />
          </div>
        ) : (
          <TimelineChart
            data={chartData}
            className={cn(
              '-mb-1.5 mt-1.5',
              isFetchingChart && 'opacity-60 transition-opacity duration-150'
            )}
            columnId="timestamp"
            filterColumnId="date"
            chartConfig={CHART_CONFIG}
          />
        )}

        <ResizablePanelGroup
          className="flex-1 border-t"
          orientation={dock === 'bottom' ? 'vertical' : 'horizontal'}
        >
          <ResizablePanel
            defaultSize="100"
            minSize="10"
            className={cn(
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
                defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
                totalRows={totalRowCount}
                filterRows={flatData.length}
                totalRowsFetched={flatData.length}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                setColumnOrder={setColumnOrder}
                setColumnVisibility={setColumnVisibility}
                searchParamsParser={SEARCH_PARAMS_PARSER}
                emptyStateMessage={
                  <div className="mx-auto max-w-md space-y-3 py-16 text-center">
                    <p className="text-sm text-foreground">No logs in the selected time range</p>
                    <p className="text-sm text-foreground-lighter">
                      Widen the time range to find earlier deploys and builds, or follow new logs
                      from the Supabase CLI.
                    </p>
                    <div className="pt-1 text-left">
                      <WorkerCommandLine
                        command={`supabase ${CLI_NAME} logs ${workerName} --follow`}
                      />
                    </div>
                  </div>
                }
              />
            </div>
          </ResizablePanel>

          {!!openRowId && !!selectedRow && (
            <ServiceFlowPanel
              dock={dock}
              setDock={setDock}
              selectedRow={selectedRow.original}
              selectedRowKey={openRowId}
              searchParameters={searchParameters}
            />
          )}
        </ResizablePanelGroup>
      </div>
    </DataTableProvider>
  )
}
