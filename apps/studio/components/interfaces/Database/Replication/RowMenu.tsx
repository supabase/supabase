import { Edit, MoreVertical, Pause, Play, Trash } from 'lucide-react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
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
import { Pipeline } from './DestinationRow'
import { PIPELINE_ERROR_MESSAGES } from './Pipeline.utils'
import { PipelineStatusName } from './PipelineStatus'

interface RowMenuProps {
  pipeline: Pipeline | undefined
  pipelineStatus: any
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  onEditClick: () => void
  onDeleteClick: () => void
}

export const RowMenu = ({
  pipeline,
  pipelineStatus,
  error,
  isLoading,
  isError,
  onEditClick,
  onDeleteClick,
}: RowMenuProps) => {
  const { ref: projectRef } = useParams()

  const getStatusName = (status: any) => {
    if (status && typeof status === 'object' && 'name' in status) {
      return status.name
    }
    return status
  }

  const statusName = getStatusName(pipelineStatus)
  const pipelineEnabled = statusName !== PipelineStatusName.STOPPED

  const { mutateAsync: startPipeline } = useStartPipelineMutation()
  const { mutateAsync: stopPipeline } = useStopPipelineMutation()
  const { setRequestStatus: setGlobalRequestStatus } = usePipelineRequestStatus()

  const onEnablePipeline = async () => {
    if (!projectRef) {
      return console.error('Project ref is required')
    }
    if (!pipeline) {
      return toast.error(PIPELINE_ERROR_MESSAGES.NO_PIPELINE_FOUND)
    }

    try {
      await startPipeline({ projectRef, pipelineId: pipeline.id })
      toast(`Enabling pipeline ${pipeline.destination_name}`)
      setGlobalRequestStatus(pipeline.id, PipelineStatusRequestStatus.EnableRequested)
    } catch (error) {
      toast.error(PIPELINE_ERROR_MESSAGES.ENABLE_DESTINATION)
    }
  }

  const onDisablePipeline = async () => {
    if (!projectRef) {
      console.error('Project ref is required')
      return
    }
    if (!pipeline) {
      toast.error(PIPELINE_ERROR_MESSAGES.NO_PIPELINE_FOUND)
      return
    }

    try {
      await stopPipeline({ projectRef, pipelineId: pipeline.id })
      toast(`Disabling pipeline ${pipeline.destination_name}`)
      setGlobalRequestStatus(pipeline.id, PipelineStatusRequestStatus.DisableRequested)
    } catch (error) {
      toast.error(PIPELINE_ERROR_MESSAGES.DISABLE_DESTINATION)
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
          <Button
            type="default"
            className="px-1.5"
            icon={<MoreVertical />}
            onClick={(e) => e.stopPropagation()}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-52">
          {pipelineEnabled ? (
            <DropdownMenuItem
              className="space-x-2"
              onClick={(e) => {
                e.stopPropagation()
                onDisablePipeline()
              }}
            >
              <Pause size={14} />
              <p>Disable pipeline</p>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="space-x-2"
              onClick={(e) => {
                e.stopPropagation()
                onEnablePipeline()
              }}
            >
              <Play size={14} />
              <p>Enable pipeline</p>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="space-x-2"
            onClick={(e) => {
              e.stopPropagation()
              onEditClick()
            }}
          >
            <Edit size={14} />
            <p>Edit destination</p>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="space-x-2"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteClick()
            }}
          >
            <Trash stroke="red" size={14} />
            <p>Delete destination</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
