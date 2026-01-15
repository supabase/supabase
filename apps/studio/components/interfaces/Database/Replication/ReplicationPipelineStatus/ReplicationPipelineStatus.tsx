import {
  Activity,
  ArrowUpCircle,
  Ban,
  ChevronDown,
  ChevronLeft,
  Info,
  Pause,
  Play,
  RotateCcw,
  Search,
  WifiOff,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { useReplicationPipelineByIdQuery } from 'data/replication/pipeline-by-id-query'
import { useReplicationPipelineReplicationStatusQuery } from 'data/replication/pipeline-replication-status-query'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import { useReplicationPipelineVersionQuery } from 'data/replication/pipeline-version-query'
import { useRestartPipelineHelper } from 'data/replication/restart-pipeline-helper'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
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
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { BatchRestartDialog } from '../BatchRestartDialog'
import { ErrorDetailsDialog } from '../ErrorDetailsDialog'
import {
  getStatusName,
  PIPELINE_ACTIONABLE_STATES,
  PIPELINE_ERROR_MESSAGES,
} from '../Pipeline.utils'
import { PipelineStatus } from '../PipelineStatus'
import { PipelineStatusName, STATUS_REFRESH_FREQUENCY_MS } from '../Replication.constants'
import { RestartTableDialog } from '../RestartTableDialog'
import { UpdateVersionModal } from '../UpdateVersionModal'
import { SlotLagMetrics } from './ReplicationPipelineStatus.types'
import { getDisabledStateConfig } from './ReplicationPipelineStatus.utils'
import { SlotLagMetricsInline, SlotLagMetricsList } from './SlotLagMetrics'
import { TableReplicationRow } from './TableReplicationRow'

/**
 * Component for displaying replication pipeline status and table replication details.
 * Supports both legacy 'error' state and new 'errored' state with retry policies.
 */
export const ReplicationPipelineStatus = () => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const [searchString, setSearchString] = useQueryState('search', parseAsString.withDefault(''))

  const [showUpdateVersionModal, setShowUpdateVersionModal] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [selectedTableError, setSelectedTableError] = useState<{
    tableName: string
    reason: string
    solution?: string
  } | null>(null)
  const [showRestartDialog, setShowRestartDialog] = useState(false)
  const [selectedTableForRestart, setSelectedTableForRestart] = useState<{
    tableId: number
    tableName: string
  } | null>(null)
  const [showBatchRestartDialog, setShowBatchRestartDialog] = useState(false)
  const [batchRestartMode, setBatchRestartMode] = useState<'all' | 'errored' | null>(null)
  const [restartingTableIds, setRestartingTableIds] = useState<Set<number>>(new Set())

  const pipelineId = Number(_pipelineId)
  const { getRequestStatus, updatePipelineStatus, setRequestStatus } = usePipelineRequestStatus()
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

  const {
    data: pipelineStatusData,
    error: pipelineStatusError,
    isLoading: isPipelineStatusLoading,
    isError: isPipelineStatusError,
    isSuccess: isPipelineStatusSuccess,
  } = useReplicationPipelineStatusQuery(
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

  const { data: versionData } = useReplicationPipelineVersionQuery({
    projectRef,
    pipelineId: pipeline?.id,
  })
  const hasUpdate = Boolean(versionData?.new_version)

  const { mutateAsync: startPipeline, isPending: isStartingPipeline } = useStartPipelineMutation()
  const { mutateAsync: stopPipeline, isPending: isStoppingPipeline } = useStopPipelineMutation()
  const { restartPipeline } = useRestartPipelineHelper()

  const destinationName = pipeline?.destination_name
  const statusName = getStatusName(pipelineStatusData?.status)
  const config = getDisabledStateConfig({ requestStatus, statusName })

  // Sort tables by name for consistent ordering (memoized)
  const tableStatuses = useMemo(
    () =>
      (replicationStatusData?.table_statuses || []).sort((a, b) =>
        a.table_name.localeCompare(b.table_name)
      ),
    [replicationStatusData?.table_statuses]
  )

  const applyLagMetrics = replicationStatusData?.apply_lag

  // Filter tables based on search (memoized)
  const filteredTableStatuses = useMemo(
    () =>
      searchString.length === 0
        ? tableStatuses
        : tableStatuses.filter((table) =>
            table.table_name.toLowerCase().includes(searchString.toLowerCase())
          ),
    [tableStatuses, searchString]
  )

  const tablesWithLag = useMemo(
    () => tableStatuses.filter((table) => Boolean(table.table_sync_lag)),
    [tableStatuses]
  )

  const erroredTables = useMemo(
    () =>
      tableStatuses.filter(
        (table) =>
          table.state.name === 'error' &&
          'retry_policy' in table.state &&
          table.state.retry_policy?.policy === 'manual_retry'
      ),
    [tableStatuses]
  )

  const hasErroredTables = erroredTables.length > 0
  const isAnyRestartInProgress = restartingTableIds.size > 0

  const isPipelineRunning = statusName === 'started'
  const hasTableData = tableStatuses.length > 0
  const isEnablingDisabling =
    requestStatus === PipelineStatusRequestStatus.StartRequested ||
    requestStatus === PipelineStatusRequestStatus.StopRequested ||
    requestStatus === PipelineStatusRequestStatus.RestartRequested
  const showDisabledState = !isPipelineRunning || isEnablingDisabling
  const refreshIntervalLabel =
    STATUS_REFRESH_FREQUENCY_MS >= 1000
      ? `${Math.round(STATUS_REFRESH_FREQUENCY_MS / 1000)}s`
      : `${STATUS_REFRESH_FREQUENCY_MS}ms`

  const logsUrl = `/project/${projectRef}/logs/replication-logs${
    pipelineId ? `?f=${encodeURIComponent(JSON.stringify({ pipeline_id: pipelineId }))}` : ''
  }`

  const label =
    statusName === 'stopped'
      ? 'Start'
      : statusName === 'started'
        ? 'Stop'
        : statusName === 'failed'
          ? 'Restart'
          : statusName

  const icon =
    statusName === 'stopped' ? (
      <Play />
    ) : statusName === 'started' ? (
      <Pause />
    ) : statusName === 'failed' ? (
      <RotateCcw />
    ) : (
      <Ban />
    )

  const onPrimaryAction = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!pipeline) return toast.error(PIPELINE_ERROR_MESSAGES.NO_PIPELINE_FOUND)

    try {
      if (statusName === 'stopped') {
        setRequestStatus(pipeline.id, PipelineStatusRequestStatus.StartRequested, statusName)
        await startPipeline({ projectRef, pipelineId: pipeline.id })
      } else if (statusName === 'started') {
        setRequestStatus(pipeline.id, PipelineStatusRequestStatus.StopRequested, statusName)
        await stopPipeline({ projectRef, pipelineId: pipeline.id })
      } else if (statusName === 'failed') {
        setRequestStatus(pipeline.id, PipelineStatusRequestStatus.RestartRequested, statusName)
        await restartPipeline({ projectRef, pipelineId: pipeline.id })
      }
    } catch (error) {
      toast.error(PIPELINE_ERROR_MESSAGES.ENABLE_DESTINATION)
    }
  }

  useEffect(() => {
    updatePipelineStatus(pipelineId, statusName)
  }, [pipelineId, statusName, updatePipelineStatus])

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <Button asChild type="outline" icon={<ChevronLeft />} style={{ padding: '5px' }}>
              <Link href={`/project/${projectRef}/database/replication`} />
            </Button>
            <div className="flex items-center gap-x-3">
              <h3 className="text-xl font-semibold">{destinationName || 'Pipeline'}</h3>
              <PipelineStatus
                pipelineStatus={pipelineStatusData?.status}
                error={pipelineStatusError}
                isLoading={isPipelineStatusLoading}
                isError={isPipelineStatusError}
                isSuccess={isPipelineStatusSuccess}
                requestStatus={requestStatus}
                pipelineId={pipelineId}
              />
            </div>
          </div>

          <div className="flex items-center gap-x-2">
            {hasUpdate && (
              <Button
                type="primary"
                icon={<ArrowUpCircle />}
                onClick={() => setShowUpdateVersionModal(true)}
              >
                Update available
              </Button>
            )}

            <Button asChild type="default">
              <Link href={logsUrl}>View logs</Link>
            </Button>

            <Button
              type={statusName === 'stopped' ? 'primary' : 'default'}
              onClick={onPrimaryAction}
              loading={isPipelineError || isStartingPipeline || isStoppingPipeline}
              disabled={
                isEnablingDisabling ||
                !PIPELINE_ACTIONABLE_STATES.includes(statusName as PipelineStatusName)
              }
              icon={icon}
              className="capitalize"
            >
              {label}
            </Button>
          </div>
        </div>
        {isPipelineError && (
          <AlertError error={pipelineError} subject={PIPELINE_ERROR_MESSAGES.RETRIEVE_PIPELINE} />
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
              <div className="h-6 w-40 rounded bg-surface-200" />
              <div className="h-5 w-24 rounded bg-surface-200" />
            </div>
            <GenericSkeletonLoader />
          </div>
        )}

        {applyLagMetrics && (
          <div className="border border-default rounded-lg bg-surface-100 px-4 py-4 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-y-1">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Replication lag</h4>
                <p className="text-xs text-foreground-light">
                  Snapshot of how far this pipeline is trailing behind right now.
                </p>
              </div>
              <p className="text-xs text-foreground-lighter">
                Updates every {refreshIntervalLabel}
              </p>
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
                  <div className="rounded border border-default/50 bg-surface-200/40">
                    <ul className="divide-y divide-default/40">
                      {tablesWithLag.map((table) => (
                        <li key={`${table.table_id}-${table.table_name}`} className="px-3 py-2">
                          <SlotLagMetricsInline
                            tableName={table.table_name}
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

        {hasTableData && (
          <div className="flex flex-col gap-y-3">
            <div className="flex items-center justify-between">
              <Input
                icon={<Search />}
                size="tiny"
                className="text-xs w-52"
                placeholder="Search for tables"
                value={searchString}
                disabled={isPipelineError}
                onChange={(e) => setSearchString(e.target.value)}
                actions={
                  searchString.length > 0 && [
                    <X
                      key="close"
                      className="mx-2 cursor-pointer text-foreground"
                      size={14}
                      strokeWidth={1.5}
                      onClick={() => setSearchString('')}
                    />,
                  ]
                }
              />
              {!showDisabledState && (
                <div className="flex items-center">
                  <Button
                    size="tiny"
                    type="default"
                    className="rounded-r-none hover:z-[2]"
                    icon={<RotateCcw />}
                    disabled={tableStatuses.length === 0 || isAnyRestartInProgress}
                    loading={isAnyRestartInProgress}
                    onClick={() => {
                      setBatchRestartMode('all')
                      setShowBatchRestartDialog(true)
                    }}
                  >
                    Restart all tables
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="default"
                        icon={<ChevronDown />}
                        className="w-7 rounded-l-none -ml-[1px]"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        disabled={!hasErroredTables || isAnyRestartInProgress}
                        onClick={() => {
                          setBatchRestartMode('errored')
                          setShowBatchRestartDialog(true)
                        }}
                      >
                        Restart failed tables only
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead key="table">Table</TableHead>
                      <TableHead key="status">Status</TableHead>
                      <TableHead key="details">Details</TableHead>
                      <TableHead key="actions" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTableStatuses.map((table) => {
                      const isRestarting = restartingTableIds.has(table.table_id)
                      const isErrorState = table.state.name === 'error'
                      const errorReason =
                        isErrorState && 'reason' in table.state ? table.state.reason : undefined
                      const errorSolution =
                        isErrorState && 'solution' in table.state ? table.state.solution : undefined
                      return (
                        <TableReplicationRow
                          key={table.table_id}
                          table={table}
                          config={config}
                          isRestarting={isRestarting}
                          showDisabledState={showDisabledState}
                          onSelectRestart={() => {
                            setSelectedTableForRestart({
                              tableId: table.table_id,
                              tableName: table.table_name,
                            })
                            setShowRestartDialog(true)
                          }}
                          onSelectShowError={
                            isErrorState && errorReason
                              ? () => {
                                  setSelectedTableError({
                                    tableName: table.table_name,
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

        {!isStatusLoading && tableStatuses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 border rounded-lg border-dashed">
            <div className="w-full max-w-sm mx-auto text-center space-y-4">
              <div className="w-16 h-16 bg-surface-200 rounded-full flex items-center justify-center mx-auto">
                <Activity className="w-8 h-8 text-foreground-lighter" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground">
                  {showDisabledState ? 'Pipeline not running' : 'No table status information'}
                </h4>
                <p className="text-sm text-foreground-light leading-relaxed">
                  {showDisabledState
                    ? `The replication pipeline is currently ${statusName || 'not active'}. Table status
                information is not available while the pipeline is in this state.`
                    : `This pipeline doesn't have any table replication status data available yet. The status will appear here once replication begins.`}
                </p>
              </div>
              <p className="text-xs text-foreground-lighter">
                Data refreshes automatically every 2 seconds
              </p>
            </div>
          </div>
        )}
      </div>

      <UpdateVersionModal
        visible={showUpdateVersionModal}
        pipeline={pipeline}
        onClose={() => setShowUpdateVersionModal(false)}
        confirmLabel={
          statusName === PipelineStatusName.STARTED || statusName === PipelineStatusName.FAILED
            ? 'Update and restart'
            : 'Update version'
        }
      />

      {/* Restart Table Confirmation Dialog */}
      {selectedTableForRestart && (
        <RestartTableDialog
          open={showRestartDialog}
          onOpenChange={setShowRestartDialog}
          tableId={selectedTableForRestart.tableId}
          tableName={selectedTableForRestart.tableName}
          onRestartStart={() => {
            setRestartingTableIds((prev) => new Set(prev).add(selectedTableForRestart.tableId))
          }}
          onRestartComplete={() => {
            setRestartingTableIds((prev) => {
              const next = new Set(prev)
              next.delete(selectedTableForRestart.tableId)
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
          totalTables={tableStatuses.length}
          erroredTablesCount={erroredTables.length}
          tables={tableStatuses}
          onRestartStart={(tableIds) => {
            setRestartingTableIds((prev) => new Set([...prev, ...tableIds]))
          }}
          onRestartComplete={(tableIds) => {
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
