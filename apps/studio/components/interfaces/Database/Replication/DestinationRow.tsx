import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ReplicationPipelinesData } from 'data/replication/pipelines-query'
import { ResponseError } from 'types'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import RowMenu from './RowMenu'
import PipelineStatus, { PipelineStatusRequestStatus, PipelineStatusName } from './PipelineStatus'
import { useParams } from 'common'
import {
  ReplicationPipelineStatusData,
  useReplicationPipelineStatusQuery,
} from 'data/replication/pipeline-status-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'
import { useDeleteDestinationMutation } from 'data/replication/delete-destination-mutation'
import DeleteDestination from './DeleteDestination'
import DestinationPanel from './DestinationPanel'

export type Pipeline = ReplicationPipelinesData['pipelines'][0]

const refreshFrequencyMs: number = 5000

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
  const [requestStatus, setRequestStatus] = useState<PipelineStatusRequestStatus>(
    PipelineStatusRequestStatus.None
  )
  const { mutateAsync: startPipeline } = useStartPipelineMutation()
  const { mutateAsync: stopPipeline } = useStopPipelineMutation()
  const pipelineStatus = pipelineStatusData?.status
  const getStatusName = (
    status: ReplicationPipelineStatusData['status'] | undefined
  ): string | undefined => {
    if (status && typeof status === 'object' && 'name' in status) {
      return status.name
    }

    return undefined
  }

  const statusName = getStatusName(pipelineStatus)
  if (
    (requestStatus === PipelineStatusRequestStatus.EnableRequested &&
      (statusName === PipelineStatusName.STARTED || statusName === PipelineStatusName.FAILED)) ||
    (requestStatus === PipelineStatusRequestStatus.DisableRequested &&
      (statusName === PipelineStatusName.STOPPED || statusName === PipelineStatusName.FAILED))
  ) {
    setRequestStatus(PipelineStatusRequestStatus.None)
  }

  const onEnableClick = async () => {
    if (!projectRef) {
      console.error('Project ref is required')
      return
    }
    if (!pipeline) {
      toast.error('No pipeline found')
      return
    }

    try {
      await startPipeline({ projectRef, pipelineId: pipeline.id })
    } catch (error) {
      toast.error('Failed to enable destination')
    }
    setRequestStatus(PipelineStatusRequestStatus.EnableRequested)
  }
  const onDisableClick = async () => {
    if (!projectRef) {
      console.error('Project ref is required')
      return
    }
    if (!pipeline) {
      toast.error('No pipeline found')
      return
    }

    try {
      await stopPipeline({ projectRef, pipelineId: pipeline.id })
    } catch (error) {
      toast.error('Failed to disable destination')
    }
    setRequestStatus(PipelineStatusRequestStatus.DisableRequested)
  }
  const { mutateAsync: deleteDestination } = useDeleteDestinationMutation({})

  const onDeleteClick = async () => {
    if (!projectRef) {
      console.error('Project ref is required')
      return
    }
    if (!pipeline) {
      toast.error('No pipeline found')
      return
    }

    try {
      await stopPipeline({ projectRef, pipelineId: pipeline.id })
      // deleting the destination also deletes the pipeline because of cascade delete
      // so we don't need to call deletePipeline explicitly
      await deleteDestination({ projectRef, destinationId: destinationId })
    } catch (error) {
      toast.error('Failed to delete destination')
    }
  }

  return (
    <>
      {isPipelineError && (
        <AlertError error={pipelineError} subject="Failed to retrieve pipeline" />
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
            <RowMenu
              pipelineStatus={pipelineStatusData?.status}
              error={pipelineStatusError}
              isLoading={isPipelineStatusLoading}
              isError={isPipelineStatusError}
              onEnableClick={onEnableClick}
              onDisableClick={onDisableClick}
              onDeleteClick={() => setShowDeleteDestinationForm(true)}
              onEditClick={() => setShowEditDestinationPanel(true)}
            ></RowMenu>
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
