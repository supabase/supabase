import { useParams } from 'common'
import {
  ArrowUpCircleIcon,
  CircleStopIcon,
  EditIcon,
  EyeIcon,
  MoreVerticalIcon,
  PlayIcon,
  RotateCcwIcon,
  TrashIcon,
} from 'lucide-react'
import Link from 'next/link'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  WarningIcon,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { getStatusName } from './Pipeline.utils'
import { PipelineStatusName } from './Replication.constants'
import {
  canModifyDestination,
  type ReplicationDestinationType,
} from './ReplicationDiagram/Nodes.utils'
import { withReplicationCluster } from '@/data/replication/cluster-path'
import { ReplicationPipelineStatusData } from '@/data/replication/pipeline-status-query'
import { Pipeline } from '@/data/replication/pipelines-query'
import { useRestartPipelineMutation } from '@/data/replication/restart-pipeline-mutation'
import { useStartPipelineMutation } from '@/data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from '@/data/replication/stop-pipeline-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import { useReplicationClusterId } from '@/state/replication-cluster'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'

interface RowMenuProps {
  destinationId: number
  destinationType: ReplicationDestinationType | undefined
  pipeline: Pipeline | undefined
  pipelineStatus?: ReplicationPipelineStatusData['status']
  error: StudioError | null
  isLoading: boolean
  isError: boolean
  hasUpdate?: boolean
  onDeleteClick: () => void
  onUpdateClick?: () => void
}

export const RowMenu = ({
  destinationId,
  destinationType,
  pipeline,
  pipelineStatus,
  error,
  isLoading,
  isError,
  hasUpdate = false,
  onDeleteClick,
  onUpdateClick,
}: RowMenuProps) => {
  const { ref: projectRef } = useParams()
  const clusterId = useReplicationClusterId()
  const statusName = getStatusName(pipelineStatus)

  const [, setEdit] = useQueryState(
    'edit',
    parseAsInteger.withOptions({ history: 'push', clearOnDefault: true })
  )
  // Destination IDs are only unique within a cluster, so the edit panel needs the row's cluster.
  const [, setEditClusterId] = useQueryState('cluster_id', parseAsString)

  const { mutateAsync: startPipeline } = useStartPipelineMutation({ onError: () => {} })
  const { mutateAsync: stopPipeline } = useStopPipelineMutation({ onError: () => {} })
  const { mutateAsync: restartPipeline } = useRestartPipelineMutation()
  const { getRequestStatus, isRequestPending, runWithRequestStatus } = usePipelineRequestStatus()
  const requestStatus = pipeline?.id
    ? getRequestStatus(pipeline.id)
    : PipelineStatusRequestStatus.None

  const isPipelineRequestPending = !!pipeline && isRequestPending(pipeline.id)
  const canModify = canModifyDestination(destinationType)
  const shouldShowUpdate = canModify && hasUpdate

  // Show actions when not in a transitional state
  const canPerformActions =
    !isError &&
    !!pipeline &&
    !isPipelineRequestPending &&
    requestStatus === PipelineStatusRequestStatus.None &&
    statusName !== PipelineStatusName.STARTING &&
    [PipelineStatusName.STOPPED, PipelineStatusName.STARTED, PipelineStatusName.FAILED].includes(
      statusName as PipelineStatusName
    )

  const shouldShowStop =
    canPerformActions &&
    (statusName === PipelineStatusName.STARTED || statusName === PipelineStatusName.FAILED)
  const shouldShowRestart = canModify && shouldShowStop

  // Show only start for stopped state
  const shouldShowStart =
    canModify && canPerformActions && statusName === PipelineStatusName.STOPPED

  const onEnablePipeline = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!pipeline) return toast.error('No pipeline found')

    try {
      await runWithRequestStatus(pipeline.id, PipelineStatusRequestStatus.StartRequested, () =>
        startPipeline({ projectRef, pipelineId: pipeline.id })
      )
    } catch (error) {
      toast.error(`Failed to start pipeline: ${(error as StudioError).message}`)
    }
  }

  const onDisablePipeline = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!pipeline) return toast.error('No pipeline found')

    try {
      await runWithRequestStatus(pipeline.id, PipelineStatusRequestStatus.StopRequested, () =>
        stopPipeline({ projectRef, pipelineId: pipeline.id })
      )
    } catch (error) {
      toast.error(`Failed to stop pipeline: ${(error as StudioError).message}`)
    }
  }

  const onRestartPipeline = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!pipeline) return toast.error('No pipeline found')

    try {
      await runWithRequestStatus(pipeline.id, PipelineStatusRequestStatus.StopRequested, () =>
        restartPipeline({ projectRef, pipelineId: pipeline.id })
      )
    } catch (error) {
      toast.error(`Failed to restart pipeline: ${(error as StudioError).message}`)
    }
  }

  return (
    <div className="flex justify-end items-center gap-x-2">
      {isLoading && <ShimmeringLoader />}

      {isError && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center" tabIndex={0}>
              <WarningIcon />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            Couldn't load status
            {error?.message ? <span>{`: ${error.message}`}</span> : <span>.</span>}
          </TooltipContent>
        </Tooltip>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="relative">
            <Button
              variant="default"
              className="w-6.5 hit-area-1"
              aria-label={
                shouldShowUpdate ? 'Pipeline options, update available' : 'Pipeline options'
              }
              icon={<MoreVerticalIcon />}
            />
            {shouldShowUpdate && (
              <span
                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary-bright"
                aria-hidden
              />
            )}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end" className="w-44">
          <DropdownMenuItem className="gap-x-2" asChild disabled={!pipeline}>
            <Link
              href={withReplicationCluster(
                `/project/${projectRef}/database/pipelines/${pipeline?.id}`,
                clusterId
              )}
            >
              <EyeIcon size={14} />
              <p>View details</p>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {shouldShowUpdate && (
            <>
              <DropdownMenuItem
                className="gap-x-2"
                onClick={() => onUpdateClick?.()}
                disabled={isPipelineRequestPending}
              >
                <ArrowUpCircleIcon size={14} />
                <p>Update available</p>
                <span
                  className="ml-auto h-2 w-2 shrink-0 rounded-full bg-primary-bright"
                  aria-hidden
                />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {shouldShowStart && (
            <>
              <DropdownMenuItem className="gap-x-2" onClick={onEnablePipeline}>
                <PlayIcon size={14} />
                <p>Start pipeline</p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {shouldShowStop && (
            <>
              {shouldShowRestart && (
                <DropdownMenuItem className="gap-x-2" onClick={onRestartPipeline}>
                  <RotateCcwIcon size={14} />
                  <p>Restart pipeline</p>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="gap-x-2" onClick={onDisablePipeline}>
                <CircleStopIcon size={14} />
                <p>Stop pipeline</p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {canModify && (
            <DropdownMenuItem
              className="gap-x-2"
              onClick={() => {
                void setEditClusterId(clusterId ?? null)
                void setEdit(destinationId)
              }}
              disabled={isPipelineRequestPending}
            >
              <EditIcon size={14} />
              <p>Edit pipeline</p>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="gap-x-2"
            onClick={onDeleteClick}
            disabled={isPipelineRequestPending}
          >
            <TrashIcon size={14} />
            <p>Delete pipeline</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
