import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ReplicationPipelinesData } from 'data/replication/pipelines-query'
import { ResponseError } from 'types'
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'
import { Info } from 'lucide-react'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import RowMenu from './RowMenu'
import PipelineStatus, { PipelineStatusName } from './PipelineStatus'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
import { getStatusName, PIPELINE_ERROR_MESSAGES } from './Pipeline.utils'
import { useParams } from 'common'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'
import { useDeleteDestinationMutation } from 'data/replication/delete-destination-mutation'
import DeleteDestination from './DeleteDestination'
import DestinationPanel from './DestinationPanel'

export type Pipeline = ReplicationPipelinesData['pipelines'][0]

const refreshFrequencyMs: number = 2000

interface DestinationRowProps {
  sourceId: number | undefined
  destinationId: number
  destinationName: string
  type: string
  pipeline: Pipeline | undefined
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  onSelectPipeline?: (pipelineId: number, destinationName: string) => void
}

const DestinationRow = ({
  sourceId,
  destinationId,
  destinationName,
  type,
  pipeline,
  error: pipelineError,
  isLoading: isPipelineLoading,
  isError: isPipelineError,
  isSuccess: isPipelineSuccess,
  onSelectPipeline,
}: DestinationRowProps) => {
  const { ref: projectRef } = useParams()
  const [showDeleteDestinationForm, setShowDeleteDestinationForm] = useState(false)
  const [showEditDestinationPanel, setShowEditDestinationPanel] = useState(false)

  const {
    data: pipelineStatusData,
    error: pipelineStatusError,
    isLoading: isPipelineStatusLoading,
    isError: isPipelineStatusError,
    isSuccess: isPipelineStatusSuccess,
  } = useReplicationPipelineStatusQuery(
    {
      projectRef,
      pipelineId: pipeline?.id,
    },
    { refetchInterval: refreshFrequencyMs }
  )
  const {
    getRequestStatus,
    setRequestStatus: setGlobalRequestStatus,
    updatePipelineStatus,
  } = usePipelineRequestStatus()
  const requestStatus = pipeline?.id
    ? getRequestStatus(pipeline.id)
    : PipelineStatusRequestStatus.None
  const { mutateAsync: startPipeline } = useStartPipelineMutation()
  const { mutateAsync: stopPipeline } = useStopPipelineMutation()
  const pipelineStatus = pipelineStatusData?.status
  const statusName = getStatusName(pipelineStatus)

  useEffect(() => {
    if (pipeline?.id) {
      updatePipelineStatus(pipeline.id, statusName)
    }
  }, [pipeline?.id, statusName, updatePipelineStatus])

  const onEnableClick = async () => {
    if (!projectRef) {
      console.error('Project ref is required')
      return
    }
    if (!pipeline) {
      toast.error(PIPELINE_ERROR_MESSAGES.NO_PIPELINE_FOUND)
      return
    }

    try {
      await startPipeline({ projectRef, pipelineId: pipeline.id })
    } catch (error) {
      toast.error(PIPELINE_ERROR_MESSAGES.ENABLE_DESTINATION)
    }
    setGlobalRequestStatus(pipeline.id, PipelineStatusRequestStatus.EnableRequested)
  }
  const onDisableClick = async () => {
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
    } catch (error) {
      toast.error(PIPELINE_ERROR_MESSAGES.DISABLE_DESTINATION)
    }
    setGlobalRequestStatus(pipeline.id, PipelineStatusRequestStatus.DisableRequested)
  }
  const { mutateAsync: deleteDestination } = useDeleteDestinationMutation({})

  const onDeleteClick = async () => {
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
      // deleting the destination also deletes the pipeline because of cascade delete
      // so we don't need to call deletePipeline explicitly
      await deleteDestination({ projectRef, destinationId: destinationId })
    } catch (error) {
      toast.error(PIPELINE_ERROR_MESSAGES.DELETE_DESTINATION)
    }
  }

  return (
    <>
      {isPipelineError && (
        <AlertError error={pipelineError} subject={PIPELINE_ERROR_MESSAGES.RETRIEVE_PIPELINE} />
      )}
      {isPipelineSuccess && (
        <Table.tr>
          <Table.td>
            {isPipelineLoading ? <ShimmeringLoader></ShimmeringLoader> : destinationName}
          </Table.td>
          <Table.td>{isPipelineLoading ? <ShimmeringLoader></ShimmeringLoader> : type}</Table.td>
          <Table.td>
            {isPipelineLoading || !pipeline ? (
              <ShimmeringLoader></ShimmeringLoader>
            ) : (
              <PipelineStatus
                pipelineStatus={pipelineStatusData?.status}
                error={pipelineStatusError}
                isLoading={isPipelineStatusLoading}
                isError={isPipelineStatusError}
                isSuccess={isPipelineStatusSuccess}
                requestStatus={requestStatus}
              ></PipelineStatus>
            )}
          </Table.td>
          <Table.td>
            {isPipelineLoading || !pipeline ? (
              <ShimmeringLoader></ShimmeringLoader>
            ) : (
              pipeline.config.publication_name
            )}
          </Table.td>
          <Table.td>
            <div className="flex items-center justify-end gap-1">
              {pipeline && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="text"
                        size="tiny"
                        icon={<Info className="w-3 h-3" />}
                        onClick={() => onSelectPipeline?.(pipeline.id, destinationName)}
                        className="h-auto p-1.5 hover:bg-surface-200"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View table replication status</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <RowMenu
                pipelineStatus={pipelineStatusData?.status}
                error={pipelineStatusError}
                isLoading={isPipelineStatusLoading}
                isError={isPipelineStatusError}
                onEnableClick={onEnableClick}
                onDisableClick={onDisableClick}
                onDeleteClick={() => setShowDeleteDestinationForm(true)}
                onEditClick={() => setShowEditDestinationPanel(true)}
              />
            </div>
          </Table.td>
        </Table.tr>
      )}
      <DeleteDestination
        visible={showDeleteDestinationForm}
        setVisible={setShowDeleteDestinationForm}
        onDelete={onDeleteClick}
        isLoading={isPipelineStatusLoading}
        name={destinationName}
      />
      <DestinationPanel
        visible={showEditDestinationPanel}
        onClose={() => setShowEditDestinationPanel(false)}
        sourceId={sourceId}
        existingDestination={{
          sourceId,
          destinationId: destinationId,
          pipelineId: pipeline?.id,
          enabled: statusName === PipelineStatusName.STARTED,
        }}
      />
    </>
  )
}

export default DestinationRow
