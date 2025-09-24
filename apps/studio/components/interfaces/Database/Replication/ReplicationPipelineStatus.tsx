import {
  Activity,
  ArrowUpCircle,
  Ban,
  ChevronLeft,
  ExternalLink,
  Info,
  Pause,
  Play,
  RotateCcw,
  Search,
  WifiOff,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { toast } from 'sonner'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useReplicationPipelineByIdQuery } from 'data/replication/pipeline-by-id-query'
import { useReplicationPipelineReplicationStatusQuery } from 'data/replication/pipeline-replication-status-query'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import { useReplicationPipelineVersionQuery } from 'data/replication/pipeline-version-query'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger, cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { ErroredTableDetails } from './ErroredTableDetails'
import {
  PIPELINE_ACTIONABLE_STATES,
  PIPELINE_ERROR_MESSAGES,
  getStatusName,
} from './Pipeline.utils'
import { PipelineStatus, PipelineStatusName } from './PipelineStatus'
import { STATUS_REFRESH_FREQUENCY_MS } from './Replication.constants'
import { SlotLagMetrics, TableState } from './ReplicationPipelineStatus.types'
import { getDisabledStateConfig, getStatusConfig } from './ReplicationPipelineStatus.utils'
import { UpdateVersionModal } from './UpdateVersionModal'
import { formatBytes } from 'lib/helpers'

type SlotLagMetricKey = keyof SlotLagMetrics

const SLOT_LAG_FIELDS: {
  key: SlotLagMetricKey
  label: string
  type: 'bytes' | 'duration'
  description: string
}[] = [
  {
    key: 'confirmed_flush_lsn_bytes',
    label: 'WAL Flush lag',
    type: 'bytes',
    description:
      'Bytes between the newest WAL record applied locally and the latest flushed WAL record acknowledged by ETL.',
  },
  {
    key: 'flush_lag',
    label: 'Flush lag',
    type: 'duration',
    description:
      'Time between flushing recent WAL locally and receiving notification that ETL has written and flushed it.',
  },
  {
    key: 'safe_wal_size_bytes',
    label: 'Remaining WAL size',
    type: 'bytes',
    description:
      'Bytes still available to write to WAL before this slot risks entering the "lost" state.',
  },
]

const numberFormatter = new Intl.NumberFormat()

const formatLagBytesValue = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return { display: '—', detail: undefined }
  }

  const decimals = value < 1024 ? 0 : value < 1024 * 1024 ? 1 : 2
  const display = formatBytes(value, decimals)
  const detail = `${numberFormatter.format(value)} bytes`

  return { display, detail }
}

const formatLagDurationValue = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return { display: '—', detail: undefined }
  }

  const sign = value < 0 ? '-' : ''
  const absMilliseconds = Math.abs(value)
  const duration = dayjs.duration(absMilliseconds, 'milliseconds')

  if (absMilliseconds < 1000) {
    return { display: `${value} ms`, detail: undefined }
  }

  const seconds = duration.asSeconds()
  if (seconds < 60) {
    const decimals = seconds >= 10 ? 1 : 2
    return {
      display: `${sign}${seconds.toFixed(decimals)} s`,
      detail: `${numberFormatter.format(value)} ms`,
    }
  }

  const minutes = duration.asMinutes()
  if (minutes < 60) {
    const roundedSeconds = Math.round(seconds)
    return {
      display: `${sign}${minutes.toFixed(minutes >= 10 ? 1 : 2)} min`,
      detail: `${numberFormatter.format(roundedSeconds)} s`,
    }
  }

  const hours = duration.asHours()
  const roundedMinutes = Math.round(minutes)
  return {
    display: `${sign}${hours.toFixed(hours >= 10 ? 1 : 2)} h`,
    detail: `${numberFormatter.format(roundedMinutes)} min`,
  }
}

const getFormattedLagValue = (type: 'bytes' | 'duration', value?: number) =>
  type === 'bytes' ? formatLagBytesValue(value) : formatLagDurationValue(value)

const SlotLagMetricsList = ({
  metrics,
  size = 'default',
}: {
  metrics: SlotLagMetrics
  size?: 'default' | 'compact'
}) => {
  const gridClasses =
    size === 'default'
      ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-y-4 gap-x-6'
      : 'grid-cols-2 gap-y-2 gap-x-4'

  const labelClasses =
    size === 'default'
      ? 'text-xs text-foreground-light'
      : 'text-[11px] text-foreground-lighter'

  const valueClasses =
    size === 'default'
      ? 'text-sm font-medium text-foreground'
      : 'text-xs font-medium text-foreground'

  return (
    <dl className={`grid ${gridClasses}`}>
      {SLOT_LAG_FIELDS.map(({ key, label, type, description }) => (
        <div key={key} className="flex flex-col gap-0.5">
          <dt className={labelClasses}>
            <span className="inline-flex items-center gap-1">
              {label}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`What is ${label}`}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-surface-200 text-foreground-lighter transition-colors hover:bg-surface-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-foreground-lighter"
                  >
                    <Info size={12} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-xs text-xs">
                  {description}
                </TooltipContent>
              </Tooltip>
            </span>
          </dt>
          {(() => {
            const { display, detail } = getFormattedLagValue(type, metrics[key])
            return (
              <dd className={`flex flex-col ${valueClasses}`}>
                <span>{display}</span>
                {detail && <span className="text-[11px] text-foreground-lighter">{detail}</span>}
              </dd>
            )
          })()}
        </div>
      ))}
    </dl>
  )
}

/**
 * Component for displaying replication pipeline status and table replication details.
 * Supports both legacy 'error' state and new 'errored' state with retry policies.
 */
export const ReplicationPipelineStatus = () => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const [filterString, setFilterString] = useState<string>('')
  const [showUpdateVersionModal, setShowUpdateVersionModal] = useState(false)
  const [isRetryingStatus, setIsRetryingStatus] = useState(false)

  const pipelineId = Number(_pipelineId)
  const { getRequestStatus, updatePipelineStatus, setRequestStatus } = usePipelineRequestStatus()
  const requestStatus = getRequestStatus(pipelineId)

  const {
    data: pipeline,
    error: pipelineError,
    isLoading: isPipelineLoading,
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
    refetch: refetchPipelineStatus,
  } = useReplicationPipelineStatusQuery(
    { projectRef, pipelineId },
    {
      enabled: !!pipelineId,
      refetchInterval: STATUS_REFRESH_FREQUENCY_MS,
    }
  )

  const {
    data: replicationStatusData,
    error: statusError,
    isLoading: isStatusLoading,
    isError: isStatusError,
    refetch: refetchReplicationStatus,
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

  const { mutateAsync: startPipeline, isLoading: isStartingPipeline } = useStartPipelineMutation()
  const { mutateAsync: stopPipeline, isLoading: isStoppingPipeline } = useStopPipelineMutation()

  const destinationName = pipeline?.destination_name
  const statusName = getStatusName(pipelineStatusData?.status)
  const config = getDisabledStateConfig({ requestStatus, statusName })

  const tableStatuses = replicationStatusData?.table_statuses || []
  const applyLagMetrics = replicationStatusData?.apply_lag
  const filteredTableStatuses =
    filterString.length === 0
      ? tableStatuses
      : tableStatuses.filter((table: TableState) =>
          table.table_name.toLowerCase().includes(filterString.toLowerCase())
        )

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

  const lastStatusRefreshRaw =
    (pipelineStatusData?.status as { updated_at?: string | number } | undefined)?.updated_at
  const lastStatusRefreshLabel = lastStatusRefreshRaw
    ? (() => {
        const parsed = dayjs(lastStatusRefreshRaw)
        return parsed.isValid()
          ? parsed.format('MMM D, YYYY • h:mm:ss A')
          : String(lastStatusRefreshRaw)
      })()
    : 'Just before connection dropped'

  const logsUrl = `/project/${projectRef}/logs/etl-replication-logs${
    pipelineId ? `?f=${encodeURIComponent(JSON.stringify({ pipeline_id: pipelineId }))}` : ''
  }`

  const label =
    statusName === 'stopped'
      ? 'Start'
      : statusName === 'started'
        ? 'Stop'
        : statusName === 'failed'
          ? 'Restart'
          : 'Action unavailable'

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
        await startPipeline({ projectRef, pipelineId: pipeline.id })
      }
    } catch (error) {
      toast.error(PIPELINE_ERROR_MESSAGES.ENABLE_DESTINATION)
    }
  }

  const onRetryStatusFetch = async () => {
    setIsRetryingStatus(true)
    try {
      await Promise.allSettled([refetchReplicationStatus(), refetchPipelineStatus()])
    } finally {
      setIsRetryingStatus(false)
    }
  }

  useEffect(() => {
    updatePipelineStatus(pipelineId, statusName)
  }, [pipelineId, statusName, updatePipelineStatus])

  return (
    <>
      <div className="space-y-4">
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
            <Input
              icon={<Search size={12} />}
              className="pl-7 h-[26px] text-xs"
              placeholder="Search for tables"
              value={filterString}
              disabled={isPipelineError}
              onChange={(e) => setFilterString(e.target.value)}
              actions={
                filterString.length > 0
                  ? [
                      <X
                        key="close"
                        className="mx-2 cursor-pointer text-foreground"
                        size={14}
                        strokeWidth={2}
                        onClick={() => setFilterString('')}
                      />,
                    ]
                  : undefined
              }
            />

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
            >
              {label}
            </Button>
          </div>
        </div>
        {isPipelineError && (
          <AlertError error={pipelineError} subject={PIPELINE_ERROR_MESSAGES.RETRIEVE_PIPELINE} />
        )}

        {isStatusError && (
          <div className="rounded-lg border border-warning-400 bg-warning-50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-warning-200 p-2 text-warning-800">
                <WifiOff size={16} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="space-y-1">
                  <p className="font-medium text-warning-900">Live updates are paused</p>
                  <p className="text-warning-800">
                    We couldn’t refresh the replication status. We’ll keep trying automatically, but
                    the numbers below may be out of date.
                  </p>
                  {statusError?.message && (
                    <p className="text-xs text-warning-700">{statusError.message}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="default"
                    size="tiny"
                    onClick={onRetryStatusFetch}
                    loading={isRetryingStatus}
                  >
                    Try again now
                  </Button>
                  <p className="text-xs text-warning-700">
                    Last update: {lastStatusRefreshLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDisabledState && (
          <div
            className={cn(
              'p-4 border border-default rounded-lg flex items-center justify-between',
              config.colors.bg
            )}
          >
            <div className="flex items-center gap-x-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  config.colors.iconBg
                )}
              >
                <div className={config.colors.icon}>{config.icon}</div>
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-medium ${config.colors.text}`}>{config.title}</h4>
                <p className={`text-sm ${config.colors.subtext}`}>{config.message}</p>
              </div>
            </div>
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
          <div className="border border-default rounded-lg bg-surface-100 p-4 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-y-1">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Replication lag</h4>
                <p className="text-xs text-foreground-light">
                  Snapshot of how far this pipeline is trailing behind right now.
                </p>
              </div>
              <p className="text-xs text-foreground-lighter">Updates every {refreshIntervalLabel}</p>
            </div>
            {isStatusError && (
              <p className="text-xs text-warning-700">
                Unable to refresh data. Showing the last values we received.
              </p>
            )}
            <SlotLagMetricsList metrics={applyLagMetrics} />
          </div>
        )}

        {hasTableData && (
          <div className="flex flex-col gap-y-4">
            <div className="w-full overflow-hidden overflow-x-auto">
              {/* [Joshen] Should update to use new Table components next time */}
              <Table
                head={[
                  <Table.th key="table">Table</Table.th>,
                  <Table.th key="status">Status</Table.th>,
                  <Table.th key="details">Details</Table.th>,
                ]}
                body={
                  <>
                    {filteredTableStatuses.length === 0 && hasTableData && (
                      <Table.tr>
                        <Table.td colSpan={3}>
                          <div className="space-y-1">
                            <p className="text-sm text-foreground">No results found</p>
                            <p className="text-sm text-foreground-light">
                              Your search for "{filterString}" did not return any results
                            </p>
                          </div>
                        </Table.td>
                      </Table.tr>
                    )}
                    {filteredTableStatuses.map((table: TableState, index: number) => {
                      const statusConfig = getStatusConfig(table.state)
                      return (
                        <Table.tr key={`${table.table_name}-${index}`} className="border-t">
                          <Table.td className="align-top">
                            <div className="flex items-center gap-x-2">
                              <p>{table.table_name}</p>

                              <ButtonTooltip
                                asChild
                                type="text"
                                className="px-1.5"
                                icon={<ExternalLink />}
                                tooltip={{
                                  content: { side: 'bottom', text: 'Open in Table Editor' },
                                }}
                              >
                                <Link
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  href={`/project/${projectRef}/editor/${table.table_id}`}
                                />
                              </ButtonTooltip>
                            </div>
                          </Table.td>
                          <Table.td className="align-top">
                            {showDisabledState ? (
                              <Badge variant="default">Not Available</Badge>
                            ) : (
                              statusConfig.badge
                            )}
                          </Table.td>
                          <Table.td className="align-top">
                            {showDisabledState ? (
                              <p className="text-sm text-foreground-lighter">
                                Status unavailable while pipeline is {config.badge.toLowerCase()}
                              </p>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="text-sm text-foreground flex-1 min-w-0">
                                    {statusConfig.description}
                                  </div>
                                  {table.table_sync_lag && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          aria-label="View lag details"
                                          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-200 text-foreground transition-colors hover:bg-surface-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-foreground-lighter"
                                        >
                                          <Info size={12} />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent className="p-0" side="top" align="end">
                                        <div className="w-64 space-y-3 rounded-md border border-default bg-surface-100 p-3">
                                          <p className="text-[11px] font-medium text-foreground">
                                            Individual table replication lag
                                          </p>
                                          <SlotLagMetricsList
                                            metrics={table.table_sync_lag}
                                            size="compact"
                                          />
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                {table.state.name === 'error' && (
                                  <ErroredTableDetails
                                    state={table.state}
                                    tableName={table.table_name}
                                    tableId={table.table_id}
                                  />
                                )}
                              </div>
                            )}
                          </Table.td>
                        </Table.tr>
                      )
                    })}
                  </>
                }
              />
            </div>
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
    </>
  )
}
