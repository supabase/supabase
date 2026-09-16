import { useParams } from 'common'
import { Activity, ChevronDown, Info, RotateCcw, Search, WifiOff, X } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeadSort,
  TableRow,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PageContainer } from 'ui-patterns/PageContainer'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { BatchRestartDialog } from '../BatchRestartDialog'
import { ErrorDetailsDialog } from '../ErrorDetailsDialog'
import { getStatusName } from '../Pipeline.utils'
import { PipelineStatusName, STATUS_REFRESH_FREQUENCY_MS } from '../Replication.constants'
import { RestartTableDialog } from '../RestartTableDialog'
import { SlotLagMetrics } from './ReplicationPipelineStatus.types'
import { getDisabledStateConfig } from './ReplicationPipelineStatus.utils'
import { SlotLagMetricsInline, SlotLagMetricsList } from './SlotLagMetrics'
import { SlotConnectionIndicator, SlotStatusBadge, SlotStatusLegend } from './SlotStatus'
import { TableReplicationRow } from './TableReplicationRow'
import { AlertError } from '@/components/ui/AlertError'
import { useReplicationPipelineByIdQuery } from '@/data/replication/pipeline-by-id-query'
import {
  useReplicationPipelineReplicationStatusQuery,
  type ReplicationPipelineTableStatus,
} from '@/data/replication/pipeline-replication-status-query'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { onSearchInputEscape } from '@/lib/keyboard'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'

type TableSortColumn = 'table' | 'status'
type TableSort = `${TableSortColumn}:${'asc' | 'desc'}`

const TABLE_STATE_SORT_ORDER: ReplicationPipelineTableStatus['state']['name'][] = [
  'error',
  'copying_table',
  'copied_table',
  'following_wal',
  'queued',
]

const compareTableStates = (
  a: ReplicationPipelineTableStatus['state'],
  b: ReplicationPipelineTableStatus['state']
) => TABLE_STATE_SORT_ORDER.indexOf(a.name) - TABLE_STATE_SORT_ORDER.indexOf(b.name)

/**
 * Component for displaying replication pipeline status and table replication details.
 * Supports both legacy 'error' state and new 'errored' state with retry policies.
 */
export const ReplicationPipelineStatus = () => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const [searchString, setSearchString] = useQueryState('search', parseAsString.withDefault(''))

  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [selectedTableError, setSelectedTableError] = useState<{
    tableName: string
    reason: string
    solution?: string
  } | null>(null)
  const [showRestartDialog, setShowRestartDialog] = useState(false)
  const [selectedTableForRestart, setSelectedTableForRestart] = useState<{
    id: number
    schema: string
    name: string
  } | null>(null)
  const [showBatchRestartDialog, setShowBatchRestartDialog] = useState(false)
  const [batchRestartMode, setBatchRestartMode] = useState<'all' | 'errored' | null>(null)
  const [restartingTableIds, setRestartingTableIds] = useState<Set<number>>(new Set())

  const pipelineId = Number(_pipelineId)
  const { getRequestStatus, setTableResetting } = usePipelineRequestStatus()
  const requestStatus = getRequestStatus(pipelineId)

  const {
    data: pipeline,
    error: pipelineError,
    isPending: isPipelineLoading,
    isError: isPipelineError,
  } = useReplicationPipelineByIdQuery({
    projectRef,
    pipelineId,
  })

  const { data: pipelineStatusData } = useReplicationPipelineStatusQuery(
    { projectRef, pipelineId },
    {
      enabled: !!pipelineId,
      refetchInterval: STATUS_REFRESH_FREQUENCY_MS,
    }
  )

  const {
    data: replicationStatusData,
    isPending: isStatusLoading,
    isError: isStatusError,
  } = useReplicationPipelineReplicationStatusQuery(
    { projectRef, pipelineId },
    {
      enabled: !!pipelineId,
      refetchInterval: STATUS_REFRESH_FREQUENCY_MS,
    }
  )

  const statusName = getStatusName(pipelineStatusData?.status)
  const config = getDisabledStateConfig({ requestStatus, statusName })

  const tableStatuses = useMemo(
    () => replicationStatusData?.table_statuses ?? [],
    [replicationStatusData?.table_statuses]
  )

  const applyLagMetrics = replicationStatusData?.apply_lag

  const [sort, setSort] = useState<TableSort>('status:asc')
  const [sortColumn, sortDirection] = sort.split(':') as [TableSortColumn, 'asc' | 'desc']

  const getAriaSort = (column: TableSortColumn) => {
    if (sortColumn !== column) return 'none'
    return sortDirection === 'asc' ? 'ascending' : 'descending'
  }

  const handleSortChange = (column: TableSortColumn) => {
    if (sortColumn !== column) return setSort(`${column}:asc`)
    setSort(`${column}:${sortDirection === 'asc' ? 'desc' : 'asc'}`)
  }

  const filteredTableStatuses = useMemo(() => {
    const items =
      searchString.length === 0
        ? [...tableStatuses]
        : tableStatuses.filter((table) =>
            `${table.schema}.${table.name}`.toLowerCase().includes(searchString.toLowerCase())
          )

    items.sort((a, b) => {
      const byName = a.schema.localeCompare(b.schema) || a.name.localeCompare(b.name)
      const comparison =
        sortColumn === 'table' ? byName : compareTableStates(a.state, b.state) || byName

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return items
  }, [tableStatuses, searchString, sortColumn, sortDirection])

  const tablesWithLag = useMemo(
    () => tableStatuses.filter((table) => Boolean(table.table_sync_lag)),
    [tableStatuses]
  )

  const erroredTables = useMemo(
    () => tableStatuses.filter((table) => table.state.name === 'error'),
    [tableStatuses]
  )

  const hasErroredTables = erroredTables.length > 0
  const isAnyRestartInProgress = restartingTableIds.size > 0

  const hasTableData = tableStatuses.length > 0
  const isPipelineActionable =
    statusName === PipelineStatusName.STARTED ||
    statusName === PipelineStatusName.STOPPED ||
    statusName === PipelineStatusName.FAILED
  const isEnablingDisabling =
    requestStatus === PipelineStatusRequestStatus.StartRequested ||
    requestStatus === PipelineStatusRequestStatus.StopRequested ||
    requestStatus === PipelineStatusRequestStatus.RestartRequested
  const isPipelineBusy = isEnablingDisabling || isAnyRestartInProgress
  const showDisabledState = isPipelineBusy || !isPipelineActionable
  const canResetErroredTables = hasErroredTables && !isAnyRestartInProgress && !showDisabledState
  const lastKnownStateMessage =
    statusName === PipelineStatusName.STOPPED
      ? 'Showing the last known table state before the pipeline was stopped.'
      : statusName === PipelineStatusName.FAILED
        ? 'Showing the last reported table state before the pipeline failed.'
        : null
  const refreshIntervalLabel =
    STATUS_REFRESH_FREQUENCY_MS >= 1000
      ? `${Math.round(STATUS_REFRESH_FREQUENCY_MS / 1000)}s`
      : `${STATUS_REFRESH_FREQUENCY_MS}ms`

  return (
    <>
      <PageContainer size="large" className="flex flex-col gap-y-4 py-6">
        {isPipelineError && (
          <AlertError error={pipelineError} subject="Failed to retrieve pipeline information" />
        )}

        {isStatusError && (
          <div className="flex items-center gap-2 rounded-lg border border-warning-400 bg-warning-50 px-3 py-2 text-xs text-warning-800">
            <WifiOff size={14} />
            <span className="font-medium">Live updates paused</span>
            <span className="text-warning-700">Retrying automatically</span>
          </div>
        )}

        {(isPipelineLoading || isStatusLoading) && (
          <div className="space-y-3">
            <div className="flex items-center gap-x-3">
              <div className="h-6 w-40 rounded-sm bg-surface-200" />
              <div className="h-5 w-24 rounded-sm bg-surface-200" />
            </div>
            <GenericSkeletonLoader />
          </div>
        )}

        {applyLagMetrics && (
          <div className="border border-default rounded-lg bg-surface-100 px-4 py-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Pipeline metrics</h4>
                <p className="text-xs text-foreground-light">
                  Live metrics on how this pipeline is doing right now.
                </p>
              </div>
              <div className="flex items-center gap-x-2.5">
                <SlotConnectionIndicator isActive={applyLagMetrics.active} />
                <span className="h-3.5 w-px bg-border" />
                <SlotStatusBadge status={applyLagMetrics.wal_status} />
                <SlotStatusLegend />
              </div>
            </div>

            {isStatusError && (
              <p className="text-xs text-warning-700">
                Unable to refresh data. Showing the last values we received.
              </p>
            )}

            <SlotLagMetricsList metrics={applyLagMetrics} />

            {tablesWithLag.length > 0 && (
              <>
                <div className="border-t border-default/40" />
                <div className="space-y-3 text-xs text-foreground">
                  <div className="flex items-start gap-2 rounded-md border border-default/50 bg-surface-200/60 px-3 py-2 text-foreground-light">
                    <Info size={14} className="mt-0.5" />
                    <span>
                      During initial sync, tables can copy and stream independently before
                      reconciling with the overall pipeline.
                    </span>
                  </div>
                  <div className="rounded-sm border border-default/50 bg-surface-200/40">
                    <ul className="divide-y divide-default/40">
                      {tablesWithLag.map((table) => (
                        <li key={table.id} className="px-3 py-2">
                          <SlotLagMetricsInline
                            tableName={`${table.schema}.${table.name}`}
                            metrics={table.table_sync_lag as SlotLagMetrics}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {!isPipelineLoading && !isStatusLoading && hasTableData && (
          <div className="flex flex-col gap-y-3">
            <div className="flex items-center justify-between">
              <Input
                icon={<Search />}
                size="tiny"
                className="text-xs w-52"
                placeholder="Search tables"
                value={searchString}
                disabled={isPipelineError}
                onChange={(e) => setSearchString(e.target.value)}
                onKeyDown={onSearchInputEscape(searchString, setSearchString)}
                actions={
                  searchString.length > 0 && (
                    <Button
                      aria-label="Clear search"
                      variant="text"
                      icon={<X />}
                      className="p-0 h-5 w-5"
                      onClick={() => setSearchString('')}
                    />
                  )
                }
              />
              <div className="flex items-center">
                <Button
                  size="tiny"
                  variant="default"
                  className="rounded-r-none hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm"
                  icon={<RotateCcw />}
                  disabled={isAnyRestartInProgress || showDisabledState || isPipelineError}
                  loading={isAnyRestartInProgress}
                  onClick={() => {
                    setBatchRestartMode('all')
                    setShowBatchRestartDialog(true)
                  }}
                >
                  Reset all tables
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      aria-label="More reset options"
                      icon={<ChevronDown />}
                      className="shrink-0 rounded-l-none px-[4px] py-[5px] -ml-px focus-visible:z-10 focus-visible:rounded-l-sm"
                      disabled={showDisabledState || isPipelineError}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      className="data-disabled:pointer-events-auto data-disabled:cursor-not-allowed"
                      disabled={!canResetErroredTables}
                      onClick={() => {
                        if (!canResetErroredTables) return
                        setBatchRestartMode('errored')
                        setShowBatchRestartDialog(true)
                      }}
                    >
                      <div className="flex flex-col gap-y-0.5">
                        <p>Reset failed tables only</p>
                        {!hasErroredTables && (
                          <p className="text-foreground-lighter">No failed tables</p>
                        )}
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {lastKnownStateMessage !== null && !showDisabledState && (
              <div className="flex items-start gap-2 rounded-md border border-default/50 bg-surface-200/60 px-3 py-2 text-xs text-foreground-light">
                <Info size={14} className="mt-0.5" />
                <span>{lastKnownStateMessage}</span>
              </div>
            )}

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead key="table" aria-sort={getAriaSort('table')}>
                        <TableHeadSort
                          column="table"
                          currentSort={sort}
                          onSortChange={handleSortChange}
                        >
                          Table
                        </TableHeadSort>
                      </TableHead>
                      <TableHead key="status" aria-sort={getAriaSort('status')}>
                        <TableHeadSort
                          column="status"
                          currentSort={sort}
                          onSortChange={handleSortChange}
                        >
                          Status
                        </TableHeadSort>
                      </TableHead>
                      <TableHead key="details">Details</TableHead>
                      <TableHead key="actions" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <tr className="sr-only" aria-live="polite" role="status">
                      <td colSpan={4}>
                        {filteredTableStatuses.length === 0 && searchString.length > 0
                          ? `No results found for “${searchString}”`
                          : ''}
                      </td>
                    </tr>
                    {filteredTableStatuses.length === 0 && (
                      <TableRow className="[&>td]:hover:bg-inherit">
                        <TableCell colSpan={4}>
                          <p className="text-sm text-foreground">No results found</p>
                          <p className="text-sm text-foreground-lighter">
                            Your search for “{searchString}” did not return any results.
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredTableStatuses.map((table) => {
                      const isRestarting = restartingTableIds.has(table.id)
                      const isErrorState = table.state.name === 'error'
                      const errorReason =
                        isErrorState && 'reason' in table.state ? table.state.reason : undefined
                      const errorSolution =
                        isErrorState && 'solution' in table.state
                          ? (table.state.solution ?? undefined)
                          : undefined
                      return (
                        <TableReplicationRow
                          key={table.id}
                          table={table}
                          isRestarting={isRestarting}
                          showDisabledState={showDisabledState}
                          disabledStateMessage={config.message}
                          isAnyRestartInProgress={isAnyRestartInProgress}
                          isPipelineStopped={statusName === PipelineStatusName.STOPPED}
                          onSelectRestart={() => {
                            setSelectedTableForRestart({
                              id: table.id,
                              schema: table.schema,
                              name: table.name,
                            })
                            setShowRestartDialog(true)
                          }}
                          onSelectShowError={
                            isErrorState && errorReason
                              ? () => {
                                  setSelectedTableError({
                                    tableName: `${table.schema}.${table.name}`,
                                    reason: errorReason,
                                    solution: errorSolution,
                                  })
                                  setShowErrorDialog(true)
                                }
                              : () => {}
                          }
                        />
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {!isPipelineLoading && !isStatusLoading && tableStatuses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 border rounded-lg border-dashed">
            <div className="w-full max-w-sm mx-auto text-center space-y-4">
              <div className="w-16 h-16 bg-surface-200 rounded-full flex items-center justify-center mx-auto">
                <Activity className="w-8 h-8 text-foreground-lighter" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">
                  {showDisabledState
                    ? config.title
                    : statusName === PipelineStatusName.STOPPED
                      ? 'Pipeline stopped'
                      : statusName === PipelineStatusName.FAILED
                        ? 'Pipeline failed'
                        : 'No table data yet'}
                </h4>
                <p className="text-sm text-foreground-light leading-relaxed">
                  {showDisabledState
                    ? config.message
                    : statusName === PipelineStatusName.STOPPED
                      ? 'Start the pipeline to begin replication.'
                      : statusName === PipelineStatusName.FAILED
                        ? 'The pipeline encountered an error. Restart it or reset your tables to recover.'
                        : 'Table status will appear here once replication begins.'}
                </p>
              </div>
              {statusName !== PipelineStatusName.STOPPED && (
                <p className="text-xs text-foreground-lighter">
                  Data refreshes every {refreshIntervalLabel}
                </p>
              )}
            </div>
          </div>
        )}
      </PageContainer>

      {/* Restart Table Confirmation Dialog */}
      {selectedTableForRestart && (
        <RestartTableDialog
          open={showRestartDialog}
          onOpenChange={setShowRestartDialog}
          table={selectedTableForRestart}
          tableSyncCopy={pipeline?.config.table_sync_copy}
          sourceId={pipeline?.source_id}
          publicationName={pipeline?.config.publication_name}
          pipelineStatusName={statusName}
          onRestartStart={() => {
            setTableResetting(pipelineId, true)
            setRestartingTableIds((prev) => new Set(prev).add(selectedTableForRestart.id))
          }}
          onRestartComplete={() => {
            setTableResetting(pipelineId, false)
            setRestartingTableIds((prev) => {
              const next = new Set(prev)
              next.delete(selectedTableForRestart.id)
              return next
            })
          }}
        />
      )}

      {/* Error Details Dialog */}
      {selectedTableError && (
        <ErrorDetailsDialog
          open={showErrorDialog}
          onOpenChange={setShowErrorDialog}
          tableName={selectedTableError.tableName}
          reason={selectedTableError.reason}
          solution={selectedTableError.solution}
        />
      )}

      {/* Batch Restart Dialog */}
      {batchRestartMode && (
        <BatchRestartDialog
          open={showBatchRestartDialog}
          onOpenChange={setShowBatchRestartDialog}
          mode={batchRestartMode}
          tables={tableStatuses}
          sourceId={pipeline?.source_id}
          publicationName={pipeline?.config.publication_name}
          tableSyncCopy={pipeline?.config.table_sync_copy}
          pipelineStatusName={statusName}
          onRestartStart={(tableIds) => {
            setTableResetting(pipelineId, true)
            setRestartingTableIds((prev) => new Set([...prev, ...tableIds]))
          }}
          onRestartComplete={(tableIds) => {
            setTableResetting(pipelineId, false)
            setRestartingTableIds((prev) => {
              const next = new Set(prev)
              tableIds.forEach((id) => next.delete(id))
              return next
            })
          }}
        />
      )}
    </>
  )
}
