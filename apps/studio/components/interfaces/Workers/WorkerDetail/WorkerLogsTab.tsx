import {
  ColumnFiltersState,
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  getFacetedMinMaxValues as getTTableFacetedMinMaxValues,
  getFacetedUniqueValues as getTTableFacetedUniqueValues,
  Row,
  Table,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { useParams } from 'common'
import { ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useQueryStates } from 'nuqs'
import { useMemo, useState } from 'react'
import { Button, cn } from 'ui'

import { WorkerCommandLine } from '../WorkerCommandLine'
import {
  generateDynamicColumns,
  UNIFIED_LOGS_COLUMNS,
} from '@/components/interfaces/UnifiedLogs/components/Columns'
import { LogsFilterBar } from '@/components/interfaces/UnifiedLogs/components/LogsFilterBar'
import { CHART_CONFIG } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.chart-config'
import {
  LOG_TYPES,
  SEARCH_PARAMS_PARSER,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import { filterFields as defaultFilterFields } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.fields'
import {
  buildDefaultColumnFilters,
  buildFilterSearchUpdate,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.filters'
import { useFilterSearchSync } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.hooks'
import { ColumnSchema } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.schema'
import { QuerySearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import {
  buildUnifiedLogsUrl,
  gateLogTypeOptions,
  getFacetedUniqueValues,
  getLevelRowClassName,
  type UnifiedLogType,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { arrSome, inDateRange } from '@/components/ui/DataTable/DataTable.utils'
import { DataTableFilterControlsDrawer } from '@/components/ui/DataTable/DataTableFilters/DataTableFilterControlsDrawer'
import { DataTableInfinite } from '@/components/ui/DataTable/DataTableInfinite'
import { DataTableProvider } from '@/components/ui/DataTable/providers/DataTableProvider'
import { RefreshButton } from '@/components/ui/DataTable/RefreshButton'
import { TimelineChart } from '@/components/ui/DataTable/TimelineChart'
import { useUnifiedLogsChartQuery } from '@/data/logs/unified-logs-chart-query'
import { useUnifiedLogsCountQuery } from '@/data/logs/unified-logs-count-query'
import { useUnifiedLogsInfiniteQuery } from '@/data/logs/unified-logs-infinite-query'
import { CLI_NAME } from '@/lib/constants/workers'

interface WorkerLogsTabProps {
  workerName: string
}

// This tab is always scoped to a single worker, so every log type other than
// `workers` is irrelevant — restrict the shared Log Type filter down to just that
// one option (with its nested Invocations/Logs/Activity stream toggles).
const WORKERS_ONLY_VISIBILITY = LOG_TYPES.reduce<Partial<Record<UnifiedLogType, boolean>>>(
  (acc, type) => ({ ...acc, [type]: type === 'workers' }),
  {}
)

// Worker rows always have `level`/`method`/`status`/`pathname` forced to null
// (see the worker source condition in UnifiedLogs.queries.ts), so those filters
// would only ever be dead ends here — only keep what's actually usable.
const WORKER_FILTER_FIELD_VALUES = new Set(['date', 'log_type', 'event_message'])

const WORKER_FILTER_FIELDS = gateLogTypeOptions(
  defaultFilterFields.filter((field) => WORKER_FILTER_FIELD_VALUES.has(field.value)),
  WORKERS_ONLY_VISIBILITY
)

const seedColumnFilters = (search: QuerySearchParamsType): ColumnFiltersState => [
  ...buildDefaultColumnFilters(search).filter((f) => f.id !== 'log_type'),
  { id: 'log_type', value: ['workers'] },
]

export const WorkerLogsTab = ({ workerName }: WorkerLogsTabProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const [search, setSearch] = useQueryStates(SEARCH_PARAMS_PARSER)

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() =>
    seedColumnFilters(search)
  )
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ select: false })
  const [columnOrder, setColumnOrder] = useState<string[]>([])

  // Always scope the query to this worker's rows — regardless of what's reflected in
  // the (read-only, single-option) Log Type filter above — so an accidental change
  // to that filter's state can never widen the query beyond this worker.
  const searchParameters = useMemo(() => {
    const parameters = Object.entries(search).reduce(
      (acc, [key, value]) => {
        if (!['id', 'live'].includes(key) && value !== null && value !== undefined) {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, unknown>
    ) as QuerySearchParamsType

    return {
      ...parameters,
      filter: [...(parameters.filter ?? []), 'log_type:eq:workers', `worker:eq:${workerName}`],
    }
  }, [search, workerName])

  const {
    data: unifiedLogsData,
    error,
    isError,
    isLoading,
    isFetching,
    hasNextPage,
    refetch: refetchLogs,
    fetchNextPage,
  } = useUnifiedLogsInfiniteQuery({ projectRef, search: searchParameters })

  const {
    data: counts,
    isPending: isLoadingCounts,
    isFetching: isFetchingCounts,
    refetch: refetchCounts,
  } = useUnifiedLogsCountQuery({ projectRef, search: searchParameters })

  const {
    data: unifiedLogsChart = [],
    isFetching: isFetchingCharts,
    refetch: refetchCharts,
  } = useUnifiedLogsChartQuery({ projectRef, search: searchParameters })

  const refetchAllData = () => {
    refetchLogs()
    refetchCounts()
    refetchCharts()
  }

  const isRefetchingData = isFetching || isFetchingCounts || isFetchingCharts

  const rawFlatData = useMemo(() => {
    return unifiedLogsData?.pages?.flatMap((page) => page.data ?? []) ?? []
  }, [unifiedLogsData?.pages])
  // [Joshen] Refer to unified-logs-infinite-query on why the need to dedupe
  const flatData = useMemo(() => {
    return rawFlatData.filter(
      (value, idx) => idx === rawFlatData.findIndex((x) => x.id === value.id)
    )
  }, [rawFlatData])

  const totalDBRowCount = counts?.totalRowCount
  const filterDBRowCount = flatData.length
  const totalFetched = flatData.length
  const facets = counts?.facets

  const getRowClassName = (row: Row<ColumnSchema>) =>
    cn(getLevelRowClassName(row.original.level), 'h-[30px]')

  const { columns: dynamicColumns, columnVisibility: dynamicColumnVisibility } = useMemo(() => {
    return generateDynamicColumns({ data: flatData })
  }, [flatData])

  const table: Table<ColumnSchema> = useReactTable({
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

  const applyFilterSearch = () => {
    setSearch(buildFilterSearchUpdate(columnFilters, WORKER_FILTER_FIELDS))
  }

  useFilterSearchSync({ applyFilterSearch, columnFilters, enabled: true })

  // Rows open in the global Logs Explorer instead of an inline panel — this tab
  // stays a compact, worker-scoped stream rather than duplicating the full page.
  const handleOpenRow = (rowId: string | undefined) => {
    if (!rowId || !projectRef) return
    const row = table.getCoreRowModel().flatRows.find((r) => r.id === rowId)
    if (!row) return

    const halfWindowMs = 15 * 60 * 1000
    router.push(
      buildUnifiedLogsUrl({
        projectRef,
        logType: 'workers',
        extraFilters: [`worker:eq:${workerName}`],
        start: new Date(row.original.date.getTime() - halfWindowMs),
        end: new Date(row.original.date.getTime() + halfWindowMs),
        id: row.original.id,
      })
    )
  }

  if (!projectRef) return null

  const openInLogsExplorerUrl = buildUnifiedLogsUrl({
    projectRef,
    logType: 'workers',
    extraFilters: [`worker:eq:${workerName}`],
    ...(search.date?.length === 2 ? { start: search.date[0], end: search.date[1] } : {}),
  })

  return (
    <DataTableProvider
      table={table}
      error={error}
      columns={UNIFIED_LOGS_COLUMNS}
      filterFields={WORKER_FILTER_FIELDS}
      columnFilters={columnFilters}
      openRowId={undefined}
      setOpenRowId={handleOpenRow}
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
        <div className="flex flex-wrap items-center gap-2 border-b border-default px-4 py-2">
          <DataTableFilterControlsDrawer />
          <div className="order-first w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
            <LogsFilterBar />
          </div>
          <div className="ml-auto flex items-center gap-x-2">
            <RefreshButton isLoading={isRefetchingData} onRefresh={refetchAllData} />
            <Button asChild variant="outline" icon={<ExternalLink size={14} />}>
              <Link href={openInLogsExplorerUrl}>Open in Logs Explorer</Link>
            </Button>
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
            chartConfig={CHART_CONFIG}
          />
        )}

        <div className="flex-1 min-h-0 border-t">
          <DataTableInfinite
            columns={UNIFIED_LOGS_COLUMNS}
            defaultColumnVisibility={{ select: false }}
            totalRows={totalDBRowCount}
            filterRows={filterDBRowCount}
            totalRowsFetched={totalFetched}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            setColumnOrder={setColumnOrder}
            setColumnVisibility={setColumnVisibility}
            searchParamsParser={SEARCH_PARAMS_PARSER}
            emptyStateMessage={
              <div className="mx-auto max-w-md space-y-3 py-16 text-center">
                <p className="text-sm text-foreground">No logs in the selected time range</p>
                <p className="text-sm text-foreground-lighter">
                  Follow them from the Supabase CLI while you wait for traffic.
                </p>
                <div className="pt-1 text-left">
                  <WorkerCommandLine command={`supabase ${CLI_NAME} logs ${workerName} --follow`} />
                </div>
              </div>
            }
          />
        </div>
      </div>
    </DataTableProvider>
  )
}
