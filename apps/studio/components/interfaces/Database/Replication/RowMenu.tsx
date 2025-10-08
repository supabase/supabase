import { ArrowUpCircle, Edit, MoreVertical, Pause, Play, RotateCcw, Trash } from 'lucide-react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ReplicationPipelineStatusData } from 'data/replication/pipeline-status-query'
import { Pipeline } from 'data/replication/pipelines-query'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
import { ResponseError } from 'types'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import {
  PIPELINE_ACTIONABLE_STATES,
  PIPELINE_DISABLE_ALLOWED_FROM,
  PIPELINE_ENABLE_ALLOWED_FROM,
  PIPELINE_ERROR_MESSAGES,
  getStatusName,
} from './Pipeline.utils'
import { PipelineStatusName } from './Replication.constants'

interface RowMenuProps {
  pipeline: Pipeline | undefined
  pipelineStatus?: ReplicationPipelineStatusData['status']
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  onEditClick: () => void
  onDeleteClick: () => void
  hasUpdate?: boolean
  onUpdateClick?: () => void
}

export const RowMenu = ({
  pipeline,
  pipelineStatus,
  error,
  isLoading,
  isError,
  onEditClick,
  onDeleteClick,
  hasUpdate = false,
  onUpdateClick,
}: RowMenuProps) => {
  const { ref: projectRef } = useParams()
  const statusName = getStatusName(pipelineStatus)

  const { mutateAsync: startPipeline } = useStartPipelineMutation()
  const { mutateAsync: stopPipeline } = useStopPipelineMutation()
  const { getRequestStatus, setRequestStatus: setGlobalRequestStatus } = usePipelineRequestStatus()
  const requestStatus = pipeline?.id
    ? getRequestStatus(pipeline.id)
    : PipelineStatusRequestStatus.None

  const hasPipelineAction =
    requestStatus === PipelineStatusRequestStatus.None &&
    [PipelineStatusName.STOPPED, PipelineStatusName.STARTED, PipelineStatusName.FAILED].includes(
      statusName as PipelineStatusName
    )

  const pipelineActionIcon =
    statusName === PipelineStatusName.STOPPED ? (
      <Play size={14} />
    ) : statusName === PipelineStatusName.STARTED ? (
      <Pause size={14} />
    ) : statusName === PipelineStatusName.FAILED ? (
      <RotateCcw size={14} />
    ) : null

  const pipelineActionLabel =
    statusName === PipelineStatusName.STOPPED
      ? 'Start pipeline'
      : statusName === PipelineStatusName.STARTED
        ? 'Stop pipeline'
        : statusName === PipelineStatusName.FAILED
          ? 'Restart pipeline'
          : null

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
      await startPipeline({ projectRef, pipelineId: pipeline.id })
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
          {hasPipelineAction && (
            <>
              <DropdownMenuItem
                className="space-x-2"
                disabled={!PIPELINE_ACTIONABLE_STATES.includes((statusName ?? '') as any)}
                onClick={() => {
                  if (statusName === PipelineStatusName.STOPPED) {
                    onEnablePipeline()
                  } else if (statusName === PipelineStatusName.STARTED) {
                    onDisablePipeline()
                  } else if (statusName === PipelineStatusName.FAILED) {
                    onRestartPipeline()
                  }
                }}
              >
                {pipelineActionIcon}
                <p>{pipelineActionLabel}</p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem className="space-x-2" onClick={onEditClick}>
            <Edit size={14} />
            <p>Edit destination</p>
          </DropdownMenuItem>
          <DropdownMenuItem className="space-x-2" onClick={onDeleteClick}>
            <Trash stroke="red" size={14} />
            <p>Delete destination</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
