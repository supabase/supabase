import { useParams } from 'common'
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
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { BatchRestartDialog } from '../BatchRestartDialog'
import { ErrorDetailsDialog } from '../ErrorDetailsDialog'
import { getPipelineDisplayState, getStatusName } from '../Pipeline.utils'
import { PipelineStatus } from '../PipelineStatus'
import { PipelineStatusName } from '../Replication.constants'
import { RestartTableDialog } from '../RestartTableDialog'
import { UpdateVersionModal } from '../UpdateVersionModal'
import { SlotLagMetrics } from './ReplicationPipelineStatus.types'
import { getDisabledStateConfig } from './ReplicationPipelineStatus.utils'
import { SlotLagMetricsInline, SlotLagMetricsList } from './SlotLagMetrics'
import { SlotConnectionIndicator, SlotStatusBadge, SlotStatusLegend } from './SlotStatus'
import { TableReplicationRow } from './TableReplicationRow'
import { AlertError } from '@/components/ui/AlertError'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { useReplicationPipelineByIdQuery } from '@/data/replication/pipeline-by-id-query'
import { useReplicationPipelineReplicationStatusQuery } from '@/data/replication/pipeline-replication-status-query'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { useReplicationPipelineVersionQuery } from '@/data/replication/pipeline-version-query'
import { useRestartPipelineMutation } from '@/data/replication/restart-pipeline-mutation'
import { useStartPipelineMutation } from '@/data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from '@/data/replication/stop-pipeline-mutation'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'
import { type ResponseError } from '@/types'

const PRIMARY_ACTIONS: Partial<
  Record<PipelineStatusName, { label: string; icon: LucideIcon; action: string }>
> = {
  [PipelineStatusName.STOPPED]: { label: 'Start', icon: Play, action: 'start' },
  [PipelineStatusName.STARTED]: { label: 'Stop', icon: Pause, action: 'stop' },
  [PipelineStatusName.FAILED]: { label: 'Restart', icon: RotateCcw, action: 'restart' },
}

const INACTIVE_PIPELINE_MESSAGES: Partial<
  Record<PipelineStatusName, { title: string; message: string; lastKnownState: string }>
> = {
  [PipelineStatusName.STOPPED]: {
    title: 'Pipeline stopped',
    message: 'Start the pipeline to begin replication.',
    lastKnownState: 'Showing the last known table state before the pipeline was stopped.',
  },
  [PipelineStatusName.FAILED]: {
    title: 'Pipeline failed',
    message: 'The pipeline encountered an error. Restart it or reset your tables to recover.',
    lastKnownState: 'Showing the last reported table state before the pipeline failed.',
  },
}

const EMPTY_PIPELINE_MESSAGE = {
  title: 'No table data yet',
  message: 'Table status will appear here once replication begins.',
}

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
    id: number
    schema: string
    name: string
  } | null>(null)
  const [showBatchRestartDialog, setShowBatchRestartDialog] = useState(false)
  const [batchRestartMode, setBatchRestartMode] = useState<'all' | 'errored' | null>(null)
  const [restartingTableIds, setRestartingTableIds] = useState<Set<number>>(new Set())

  const pipelineId = Number(_pipelineId)
  const { getRequestStatus, updatePipelineStatus, runWithRequestStatus } =
    usePipelineRequestStatus()
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
    }
  )

  const { data: versionData } = useReplicationPipelineVersionQuery({
    projectRef,
    pipelineId: pipeline?.id,
  })
  const hasUpdate = Boolean(versionData?.new_version)

  // The action handler displays errors for these mutations.
  const { mutateAsync: startPipeline, isPending: isStartingPipeline } = useStartPipelineMutation({
    onError: () => {},
  })
  const { mutateAsync: stopPipeline, isPending: isStoppingPipeline } = useStopPipelineMutation({
    onError: () => {},
  })
  const { mutateAsync: restartPipeline, isPending: isRestartingPipeline } =
    useRestartPipelineMutation()

  const destinationName = pipeline?.destination_name
  const statusName = getStatusName(pipelineStatusData?.status)
  const displayState = getPipelineDisplayState(requestStatus, statusName)
  const config = getDisabledStateConfig({ requestStatus, statusName })

  // Sort tables by schema and name for consistent ordering (memoized)
  const tableStatuses = useMemo(
    () =>
      (replicationStatusData?.table_statuses ?? []).toSorted(
        (a, b) => a.schema.localeCompare(b.schema) || a.name.localeCompare(b.name)
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
            `${table.schema}.${table.name}`.toLowerCase().includes(searchString.toLowerCase())
          ),
    [tableStatuses, searchString]
  )

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
  const isPipelineBusy =
    isEnablingDisabling ||
    isAnyRestartInProgress ||
    isStartingPipeline ||
    isStoppingPipeline ||
    isRestartingPipeline
  const showDisabledState = isPipelineBusy || !isPipelineActionable || isPipelineStatusError
  const inactiveMessage = INACTIVE_PIPELINE_MESSAGES[statusName ?? PipelineStatusName.UNKNOWN]
  const lastKnownStateMessage = inactiveMessage?.lastKnownState ?? null
  const emptyStateMessage = showDisabledState ? config : (inactiveMessage ?? EMPTY_PIPELINE_MESSAGE)

  const logsUrl = `/project/${projectRef}/logs/replication-logs${
    pipelineId ? `?f=${encodeURIComponent(JSON.stringify({ pipeline_id: pipelineId }))}` : ''
  }`

  const primaryAction = PRIMARY_ACTIONS[statusName ?? PipelineStatusName.UNKNOWN]
  const label = isEnablingDisabling
    ? displayState.label
    : (primaryAction?.label ?? displayState.label)
  const PrimaryActionIcon = primaryAction?.icon ?? Ban

  const onPrimaryAction = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!pipeline) return toast.error('No pipeline found')

    const action = primaryAction?.action ?? 'restart'
    try {
      if (statusName === PipelineStatusName.STOPPED) {
        await runWithRequestStatus(
          pipeline.id,
          PipelineStatusRequestStatus.StartRequested,
          statusName,
          () => startPipeline({ projectRef, pipelineId: pipeline.id })
        )
      } else if (statusName === PipelineStatusName.STARTED) {
        await runWithRequestStatus(
          pipeline.id,
          PipelineStatusRequestStatus.StopRequested,
          statusName,
          () => stopPipeline({ projectRef, pipelineId: pipeline.id })
        )
      } else if (statusName === PipelineStatusName.FAILED) {
        await runWithRequestStatus(
          pipeline.id,
          PipelineStatusRequestStatus.RestartRequested,
          statusName,
          () => restartPipeline({ projectRef, pipelineId: pipeline.id })
        )
      }
    } catch (error) {
      toast.error(`Failed to ${action} pipeline: ${(error as ResponseError).message}`)
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
            <Button asChild variant="outline" icon={<ChevronLeft />} style={{ padding: '5px' }}>
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
                variant="primary"
                icon={<ArrowUpCircle />}
                onClick={() => setShowUpdateVersionModal(true)}
              >
                Update available
              </Button>
            )}

            <Button asChild>
              <Link href={logsUrl}>View logs</Link>
            </Button>

            <Button
              variant={statusName === PipelineStatusName.STOPPED ? 'primary' : 'default'}
              onClick={onPrimaryAction}
              loading={isPipelineError || displayState.type === 'loading' || isPipelineBusy}
              disabled={showDisabledState}
              icon={<PrimaryActionIcon />}
              className="capitalize"
            >
              {label}
            </Button>
          </div>
        </div>
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
              <div className="flex items-center">
                <Button
                  size="tiny"
                  className="rounded-r-none hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm"
                  icon={<RotateCcw />}
                  disabled={isAnyRestartInProgress || showDisabledState || isPipelineError}
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
                      aria-label="More restart options"
                      icon={<ChevronDown />}
                      className="shrink-0 rounded-l-none px-[4px] py-[5px] -ml-px focus-visible:z-10 focus-visible:rounded-l-sm"
                      disabled={showDisabledState || isPipelineError}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuItemTooltip
                      disabled={!hasErroredTables || isAnyRestartInProgress || showDisabledState}
                      onClick={() => {
                        setBatchRestartMode('errored')
                        setShowBatchRestartDialog(true)
                      }}
                      tooltip={{
                        content: {
                          side: 'left',
                          text: !hasErroredTables ? 'No failed tables' : undefined,
                        },
                      }}
                    >
                      Restart failed tables
                    </DropdownMenuItemTooltip>
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
                      <TableHead key="table">Table</TableHead>
                      <TableHead key="status">Status</TableHead>
                      <TableHead key="details">Details</TableHead>
                      <TableHead key="actions" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
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
                <h4 className="text-lg font-semibold text-foreground">{emptyStateMessage.title}</h4>
                <p className="text-sm text-foreground-light leading-relaxed">
                  {emptyStateMessage.message}
                </p>
              </div>
              {statusName !== PipelineStatusName.STOPPED && (
                <p className="text-xs text-foreground-lighter">Updates automatically</p>
              )}
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
          table={selectedTableForRestart}
          tableSyncCopy={pipeline?.config.table_sync_copy}
          sourceId={pipeline?.source_id}
          publicationName={pipeline?.config.publication_name}
          onRestartStart={() => {
            setRestartingTableIds((prev) => new Set(prev).add(selectedTableForRestart.id))
          }}
          onRestartComplete={() => {
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
