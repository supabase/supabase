import {
  Activity,
  ArrowUpCircle,
  Ban,
  ChevronLeft,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  Search,
  X,
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
import { useReplicationPipelineVersionQuery } from 'data/replication/pipeline-version-query'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
import { Badge, Button, cn } from 'ui'
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
import { TableState } from './ReplicationPipelineStatus.types'
import { getDisabledStateConfig, getStatusConfig } from './ReplicationPipelineStatus.utils'
import { UpdateVersionModal } from './UpdateVersionModal'

/**
 * Component for displaying replication pipeline status and table replication details.
 * Supports both legacy 'error' state and new 'errored' state with retry policies.
 */
export const ReplicationPipelineStatus = () => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const [filterString, setFilterString] = useState<string>('')
  const [showUpdateVersionModal, setShowUpdateVersionModal] = useState(false)

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

        {(isPipelineLoading || isStatusLoading) && <GenericSkeletonLoader />}

        {isPipelineError && (
          <AlertError error={pipelineError} subject={PIPELINE_ERROR_MESSAGES.RETRIEVE_PIPELINE} />
        )}

        {isStatusError && (
          <AlertError
            error={statusError}
            subject={PIPELINE_ERROR_MESSAGES.RETRIEVE_REPLICATION_STATUS}
          />
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
                              <div className="space-y-1">
                                <div className="text-sm text-foreground">
                                  {statusConfig.description}
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
