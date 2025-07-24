import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  Clock,
  Copy,
  ExternalLink,
  HelpCircle,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useReplicationPipelineByIdQuery } from 'data/replication/pipeline-by-id-query'
import { useReplicationPipelineReplicationStatusQuery } from 'data/replication/pipeline-replication-status-query'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
import {
  Badge,
  Button,
  cn,
  copyToClipboard,
  Input_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { getPipelineStateMessages, getStatusName, PIPELINE_ERROR_MESSAGES } from './Pipeline.utils'
import { PipelineStatus } from './PipelineStatus'

type TableState = {
  table_id: number
  table_name: string
  state:
    | { name: 'queued' }
    | { name: 'copying_table' }
    | { name: 'copied_table' }
    | { name: 'following_wal'; lag: number }
    | { name: 'error'; message: string }
}

interface ReplicationPipelineStatusProps {
  pipelineId: number
  destinationName?: string
  onSelectBack: () => void
}

export const ReplicationPipelineStatus = ({
  pipelineId,
  destinationName,
  onSelectBack,
}: ReplicationPipelineStatusProps) => {
  const { ref: projectRef } = useParams()
  const [filterString, setFilterString] = useState<string>('')

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
  } = useReplicationPipelineStatusQuery(
    { projectRef, pipelineId },
    {
      enabled: !!pipelineId,
      refetchInterval: 2000, // Poll every 2 seconds
    }
  )

  const {
    data: replicationStatusData,
    error: statusError,
    isLoading: isStatusLoading,
    isError: isStatusError,
  } = useReplicationPipelineReplicationStatusQuery(
    { projectRef, pipelineId },
    {
      enabled: !!pipelineId,
      refetchInterval: 2000, // Poll every 2 seconds
    }
  )

  const { mutateAsync: startPipeline, isLoading: isStartingPipeline } = useStartPipelineMutation()
  const { mutateAsync: stopPipeline, isLoading: isStoppingPipeline } = useStopPipelineMutation()

  const statusName = getStatusName(pipelineStatusData?.status)

  const handleCopyTableStatus = async (tableName: string, state: TableState['state']) => {
    const statusText = `Table: ${tableName}\nStatus: ${state.name}${
      'message' in state ? `\nError: ${state.message}` : ''
    }${'lag' in state ? `\nLag: ${state.lag}ms` : ''}`

    try {
      await copyToClipboard(statusText)
      toast.success('Table status copied to clipboard')
    } catch {
      toast.error(PIPELINE_ERROR_MESSAGES.COPY_TABLE_STATUS)
    }
  }

  const getStatusConfig = (state: TableState['state']) => {
    switch (state.name) {
      case 'queued':
        return {
          badge: <Badge variant="warning">Queued</Badge>,
          description: 'Waiting to start replication',
          color: 'text-warning-600',
        }
      case 'copying_table':
        return {
          badge: <Badge variant="brand">Copying</Badge>,
          description: 'Initial data copy in progress',
          color: 'text-brand-600',
        }
      case 'copied_table':
        return {
          badge: <Badge variant="success">Copied</Badge>,
          description: 'Initial copy completed',
          color: 'text-success-600',
        }
      case 'following_wal':
        return {
          badge: <Badge variant="success">Live</Badge>,
          description: `Replicating live changes`,
          color: 'text-success-600',
        }
      case 'error':
        return {
          badge: <Badge variant="destructive">Error</Badge>,
          description: state.message,
          color: 'text-destructive-600',
        }
      default:
        return {
          badge: <Badge variant="warning">Unknown</Badge>,
          description: 'Unknown status',
          color: 'text-warning-600',
        }
    }
  }

  const getDisabledStateConfig = () => {
    const { title, message, badge } = getPipelineStateMessages(requestStatus, statusName)

    // Get icon and colors based on current state
    const isEnabling = requestStatus === PipelineStatusRequestStatus.EnableRequested
    const isDisabling = requestStatus === PipelineStatusRequestStatus.DisableRequested
    const isTransitioning = isEnabling || isDisabling

    const icon = isTransitioning ? (
      <Loader2 className="w-6 h-6 animate-spin" />
    ) : statusName === 'failed' ? (
      <XCircle className="w-6 h-6" />
    ) : statusName === 'starting' ? (
      <Clock className="w-6 h-6" />
    ) : statusName === 'unknown' ? (
      <HelpCircle className="w-6 h-6" />
    ) : (
      <Activity className="w-6 h-6" />
    )

    const colors = isEnabling
      ? {
          bg: 'bg-brand-50',
          text: 'text-brand-900',
          subtext: 'text-brand-700',
          iconBg: 'bg-brand-600',
          icon: 'text-white dark:text-black',
        }
      : isDisabling || statusName === 'starting' || statusName === 'unknown'
        ? {
            bg: 'bg-warning-50',
            text: 'text-warning-900',
            subtext: 'text-warning-700',
            iconBg: 'bg-warning-600',
            icon: 'text-white dark:text-black',
          }
        : statusName === 'failed'
          ? {
              bg: 'bg-destructive-50',
              text: 'text-destructive-900',
              subtext: 'text-destructive-700',
              iconBg: 'bg-destructive-600',
              icon: 'text-white dark:text-black',
            }
          : {
              bg: 'bg-surface-100',
              text: 'text-foreground',
              subtext: 'text-foreground-light',
              iconBg: 'bg-foreground-lighter',
              icon: 'text-white dark:text-black',
            }

    return { title, message, badge, icon, colors }
  }

  const config = getDisabledStateConfig()
  const tableStatuses = replicationStatusData?.table_statuses || []
  const filteredTableStatuses =
    filterString.length === 0
      ? tableStatuses
      : tableStatuses.filter((table: TableState) =>
          table.table_name.toLowerCase().includes(filterString.toLowerCase())
        )

  const errorTables = tableStatuses.filter((table: TableState) => table.state.name === 'error')
  const hasErrors = errorTables.length > 0
  const isPipelineRunning = statusName === 'started'
  const hasTableData = tableStatuses.length > 0
  const isEnablingDisabling =
    requestStatus === PipelineStatusRequestStatus.EnableRequested ||
    requestStatus === PipelineStatusRequestStatus.DisableRequested
  const showDisabledState = !isPipelineRunning || isEnablingDisabling
  const showActiveTable = isPipelineRunning && !isEnablingDisabling

  const onTogglePipeline = async () => {
    if (!projectRef) {
      return console.error('Project ref is required')
    }
    if (!pipeline) {
      return toast.error(PIPELINE_ERROR_MESSAGES.NO_PIPELINE_FOUND)
    }

    try {
      if (statusName === 'stopped') {
        await startPipeline({ projectRef, pipelineId: pipeline.id })
        setRequestStatus(pipeline.id, PipelineStatusRequestStatus.EnableRequested)
      } else if (statusName === 'started') {
        await stopPipeline({ projectRef, pipelineId: pipeline.id })
        setRequestStatus(pipeline.id, PipelineStatusRequestStatus.DisableRequested)
      }
    } catch (error) {
      toast.error(PIPELINE_ERROR_MESSAGES.ENABLE_DESTINATION)
    }
  }

  useEffect(() => {
    updatePipelineStatus(pipelineId, statusName)
  }, [pipelineId, statusName, updatePipelineStatus])

  if (isPipelineError) {
    return (
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <Button
              type="outline"
              onClick={onSelectBack}
              icon={<ChevronLeft />}
              style={{ padding: '5px' }}
            />
            <h3 className="text-xl font-semibold">Pipeline Status</h3>
          </div>
        </div>
        <AlertError error={pipelineError} subject={PIPELINE_ERROR_MESSAGES.RETRIEVE_PIPELINE} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with back button and filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <Button
            type="outline"
            onClick={onSelectBack}
            icon={<ChevronLeft />}
            style={{ padding: '5px' }}
          />
          <div>
            <div className="flex items-center gap-x-3">
              <h3 className="text-xl font-semibold">{destinationName || 'Pipeline'}</h3>
              <PipelineStatus
                pipelineStatus={pipelineStatusData?.status}
                error={pipelineStatusError}
                isLoading={isPipelineStatusLoading}
                isError={isPipelineStatusError}
                isSuccess={isPipelineStatusSuccess}
                requestStatus={requestStatus}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-x-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-lighter"
              size={14}
            />
            <Input_Shadcn_
              className="pl-9 h-8"
              placeholder="Filter tables"
              value={filterString}
              onChange={(e) => setFilterString(e.target.value)}
            />
          </div>
          <Button
            type={statusName === 'stopped' ? 'primary' : 'default'}
            onClick={() => onTogglePipeline()}
            loading={isStartingPipeline || isStoppingPipeline}
            disabled={!['started', 'stopped'].includes(statusName ?? '')}
          >
            {statusName === 'stopped' ? 'Enable' : 'Disable'} pipeline
          </Button>
        </div>
      </div>

      {(isPipelineLoading || isStatusLoading) && <GenericSkeletonLoader />}

      {isStatusError && (
        <AlertError
          error={statusError}
          subject={PIPELINE_ERROR_MESSAGES.RETRIEVE_REPLICATION_STATUS}
        />
      )}

      {hasErrors && (
        <div className="p-4 border border-destructive-300 bg-destructive-100 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-destructive-900 mb-1">
                {errorTables.length} table{errorTables.length > 1 ? 's' : ''} failed
              </h4>
              <p className="text-sm text-destructive-700 mb-3">
                Some tables encountered replication errors. Check the logs for detailed error
                information.
              </p>
              <Button
                asChild
                type="outline"
                size="tiny"
                icon={<ExternalLink className="w-3 h-3" />}
                className="text-destructive-600 border-destructive-300 hover:bg-destructive-50"
              >
                <Link
                  target="_blank"
                  rel="noreferrer noopener"
                  href={`/project/${projectRef}/logs/postgres-logs`}
                >
                  View Logs
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {hasTableData && (
        <div className="flex flex-col gap-y-4">
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

          <div className="w-full overflow-hidden overflow-x-auto">
            <Table
              head={[
                <Table.th key="table">Table</Table.th>,
                <Table.th key="status">Status</Table.th>,
                <Table.th key="details">Details</Table.th>,
                <Table.th key="actions" className="w-16 text-center">
                  Actions
                </Table.th>,
              ]}
              body={filteredTableStatuses.map((table: TableState, index: number) => {
                const statusConfig = getStatusConfig(table.state)
                return (
                  <Table.tr key={`${table.table_name}-${index}`} className="border-t opacity-50">
                    <Table.td>
                      <div className="flex items-center gap-x-2">
                        <p>{table.table_name}</p>
                        <Tooltip>
                          <TooltipTrigger>
                            <a
                              target="_blank"
                              rel="noopener noreferrer"
                              href={`/project/${projectRef}/editor/${table.table_id}`}
                            >
                              <ExternalLink size={14} />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>Open in Table Editor</TooltipContent>
                        </Tooltip>
                      </div>
                    </Table.td>
                    <Table.td>
                      {showDisabledState ? (
                        <Badge variant="default">Not Available</Badge>
                      ) : (
                        statusConfig.badge
                      )}
                    </Table.td>
                    <Table.td>
                      {showDisabledState ? (
                        <p className="text-sm text-foreground-lighter">
                          Status unavailable while pipeline is {config.badge.toLowerCase()}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-sm text-foreground">{statusConfig.description}</div>
                          {'lag' in table.state && (
                            <div className="text-xs text-foreground-light">
                              Lag: {table.state.lag}ms
                            </div>
                          )}
                        </div>
                      )}
                    </Table.td>
                    <Table.td className="text-center">
                      <ButtonTooltip
                        type="text"
                        size="tiny"
                        icon={<Copy className="w-3 h-3" />}
                        className="px-1.5"
                        disabled={showDisabledState}
                        onClick={() => handleCopyTableStatus(table.table_name, table.state)}
                        tooltip={{
                          content: {
                            side: 'bottom',
                            text: showDisabledState
                              ? `Copy unavailable while pipeline is ${config.badge.toLowerCase()}`
                              : 'Copy status details',
                          },
                        }}
                      />
                    </Table.td>
                  </Table.tr>
                )
              })}
            />
          </div>
        </div>
      )}

      {/* No results - running pipeline */}
      {showActiveTable &&
        !isStatusLoading &&
        filteredTableStatuses.length === 0 &&
        hasTableData && (
          <div className="text-center py-8 text-foreground-light">
            <p>No tables match "{filterString}"</p>
          </div>
        )}

      {/* No results - not running pipeline */}
      {showDisabledState &&
        !isStatusLoading &&
        filteredTableStatuses.length === 0 &&
        hasTableData && (
          <div className="text-center py-8 text-foreground-light">
            <p>No tables match "{filterString}"</p>
          </div>
        )}

      {/* Empty state - running pipeline */}
      {showActiveTable && !isStatusLoading && tableStatuses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-full max-w-sm mx-auto text-center space-y-4">
            <div className="w-16 h-16 bg-surface-200 rounded-full flex items-center justify-center mx-auto">
              <Activity className="w-8 h-8 text-foreground-lighter" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-foreground">No table status information</h4>
              <p className="text-sm text-foreground-light leading-relaxed">
                This pipeline doesn't have any table replication status data available yet. The
                status will appear here once replication begins.
              </p>
            </div>
            <p className="text-xs text-foreground-lighter">
              Data refreshes automatically every 2 seconds
            </p>
          </div>
        </div>
      )}

      {/* Empty state - not running pipeline */}
      {showDisabledState && !isStatusLoading && tableStatuses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-full max-w-sm mx-auto text-center space-y-4">
            <div className="w-16 h-16 bg-surface-200 rounded-full flex items-center justify-center mx-auto">
              <Activity className="w-8 h-8 text-foreground-lighter" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-foreground-light">Pipeline Not Running</h4>
              <p className="text-sm text-foreground-light leading-relaxed">
                The replication pipeline is currently {statusName || 'not active'}. Table status
                information is not available while the pipeline is in this state.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
