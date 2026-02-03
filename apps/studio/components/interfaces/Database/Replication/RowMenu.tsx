import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ReplicationPipelineStatusData } from 'data/replication/pipeline-status-query'
import { Pipeline } from 'data/replication/pipelines-query'
import { useRestartPipelineHelper } from 'data/replication/restart-pipeline-helper'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'
import { ArrowUpCircle, Edit, MoreVertical, Pause, Play, RotateCcw, Trash } from 'lucide-react'
import { parseAsInteger, useQueryState } from 'nuqs'
import { toast } from 'sonner'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
import type { ResponseError } from 'types'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  PIPELINE_DISABLE_ALLOWED_FROM,
  PIPELINE_ENABLE_ALLOWED_FROM,
  PIPELINE_ERROR_MESSAGES,
  getStatusName,
} from './Pipeline.utils'
import { PipelineStatusName } from './Replication.constants'

interface RowMenuProps {
  destinationId: number
  pipeline: Pipeline | undefined
  pipelineStatus?: ReplicationPipelineStatusData['status']
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  hasUpdate?: boolean
  onDeleteClick: () => void
  onUpdateClick?: () => void
}

export const RowMenu = ({
  destinationId,
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
  const statusName = getStatusName(pipelineStatus)

  const [_, setEdit] = useQueryState(
    'edit',
    parseAsInteger.withOptions({ history: 'push', clearOnDefault: true })
  )

  const { mutateAsync: startPipeline } = useStartPipelineMutation()
  const { mutateAsync: stopPipeline } = useStopPipelineMutation()
  const { restartPipeline } = useRestartPipelineHelper()
  const { getRequestStatus, setRequestStatus: setGlobalRequestStatus } = usePipelineRequestStatus()
  const requestStatus = pipeline?.id
    ? getRequestStatus(pipeline.id)
    : PipelineStatusRequestStatus.None

  // Show actions when not in a transitional state
  const canPerformActions =
    requestStatus === PipelineStatusRequestStatus.None &&
    statusName !== PipelineStatusName.STARTING &&
    [PipelineStatusName.STOPPED, PipelineStatusName.STARTED, PipelineStatusName.FAILED].includes(
      statusName as PipelineStatusName
    )

  // Show both stop and restart for started/failed states
  const showStopAndRestart =
    canPerformActions &&
    (statusName === PipelineStatusName.STARTED || statusName === PipelineStatusName.FAILED)

  // Show only start for stopped state
  const showStart = canPerformActions && statusName === PipelineStatusName.STOPPED

  const onEnablePipeline = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!pipeline) return toast.error(PIPELINE_ERROR_MESSAGES.NO_PIPELINE_FOUND)

    try {
      // Only show 'enabling' when transitioning from allowed states
      if (PIPELINE_ENABLE_ALLOWED_FROM.includes(statusName as any)) {
        setGlobalRequestStatus(pipeline.id, PipelineStatusRequestStatus.StartRequested, statusName)
      }
      await startPipeline({ projectRef, pipelineId: pipeline.id })
    } catch (error) {
      setGlobalRequestStatus(pipeline.id, PipelineStatusRequestStatus.None)
      toast.error(PIPELINE_ERROR_MESSAGES.ENABLE_DESTINATION)
    }
  }

  const onDisablePipeline = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!pipeline) return toast.error(PIPELINE_ERROR_MESSAGES.NO_PIPELINE_FOUND)

    try {
      // Only show 'disabling' when transitioning from allowed states
      if (PIPELINE_DISABLE_ALLOWED_FROM.includes(statusName as any)) {
        setGlobalRequestStatus(pipeline.id, PipelineStatusRequestStatus.StopRequested, statusName)
      }
      await stopPipeline({ projectRef, pipelineId: pipeline.id })
    } catch (error) {
      setGlobalRequestStatus(pipeline.id, PipelineStatusRequestStatus.None)
      toast.error(PIPELINE_ERROR_MESSAGES.DISABLE_DESTINATION)
    }
  }

  const onRestartPipeline = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!pipeline) return toast.error(PIPELINE_ERROR_MESSAGES.NO_PIPELINE_FOUND)

    try {
      setGlobalRequestStatus(pipeline.id, PipelineStatusRequestStatus.RestartRequested, statusName)
      await restartPipeline({ projectRef, pipelineId: pipeline.id })
    } catch (error) {
      setGlobalRequestStatus(pipeline.id, PipelineStatusRequestStatus.None)
      toast.error(PIPELINE_ERROR_MESSAGES.ENABLE_DESTINATION)
    }
  }

  return (
    <div className="flex justify-end items-center space-x-2">
      {isLoading && <ShimmeringLoader />}

      {isError && (
        <AlertError error={error} subject={PIPELINE_ERROR_MESSAGES.RETRIEVE_PIPELINE_STATUS} />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="relative">
            <Button type="default" className="px-1.5" icon={<MoreVertical />} />
            {hasUpdate && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-brand rounded-full" />
            )}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end" className="w-52">
          {hasUpdate && (
            <>
              <DropdownMenuItem className="space-x-2" onClick={() => onUpdateClick?.()}>
                <ArrowUpCircle size={14} />
                <p>Update available</p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {showStart && (
            <>
              <DropdownMenuItem className="space-x-2" onClick={onEnablePipeline}>
                <Play size={14} />
                <p>Start pipeline</p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {showStopAndRestart && (
            <>
              <DropdownMenuItem className="space-x-2" onClick={onRestartPipeline}>
                <RotateCcw size={14} />
                <p>Restart pipeline</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="space-x-2" onClick={onDisablePipeline}>
                <Pause size={14} />
                <p>Stop pipeline</p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem className="space-x-2" onClick={() => setEdit(destinationId)}>
            <Edit size={14} />
            <p>Edit destination</p>
          </DropdownMenuItem>
          <DropdownMenuItem className="space-x-2" onClick={onDeleteClick}>
            <Trash size={14} />
            <p>Delete destination</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
