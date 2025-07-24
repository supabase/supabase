import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { useDeleteDestinationMutation } from 'data/replication/delete-destination-mutation'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import { ReplicationPipelinesData } from 'data/replication/pipelines-query'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
import { ResponseError } from 'types'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import DeleteDestination from './DeleteDestination'
import DestinationPanel from './DestinationPanel'
import { getStatusName, PIPELINE_ERROR_MESSAGES } from './Pipeline.utils'
import { PipelineStatus, PipelineStatusName } from './PipelineStatus'
import { RowMenu } from './RowMenu'

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

export const DestinationRow = ({
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
  const { getRequestStatus, updatePipelineStatus } = usePipelineRequestStatus()
  const requestStatus = pipeline?.id
    ? getRequestStatus(pipeline.id)
    : PipelineStatusRequestStatus.None

  const { mutateAsync: stopPipeline } = useStopPipelineMutation()
  const { mutateAsync: deleteDestination } = useDeleteDestinationMutation({})

  const pipelineStatus = pipelineStatusData?.status
  const statusName = getStatusName(pipelineStatus)

  const onDeleteClick = async () => {
    if (!projectRef) {
      return console.error('Project ref is required')
    }
    if (!pipeline) {
      return toast.error(PIPELINE_ERROR_MESSAGES.NO_PIPELINE_FOUND)
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

  useEffect(() => {
    if (pipeline?.id) {
      updatePipelineStatus(pipeline.id, statusName)
    }
  }, [pipeline?.id, statusName, updatePipelineStatus])

  return (
    <>
      {isPipelineError && (
        <AlertError error={pipelineError} subject={PIPELINE_ERROR_MESSAGES.RETRIEVE_PIPELINE} />
      )}
      {isPipelineSuccess && (
        <Table.tr
          className="hover:!bg-surface-200 transition"
          onClick={() => {
            if (pipeline) onSelectPipeline?.(pipeline.id, destinationName)
          }}
        >
          <Table.td>{isPipelineLoading ? <ShimmeringLoader /> : destinationName}</Table.td>
          <Table.td>{isPipelineLoading ? <ShimmeringLoader /> : type}</Table.td>
          <Table.td>
            {isPipelineLoading || !pipeline ? (
              <ShimmeringLoader />
            ) : (
              <PipelineStatus
                pipelineStatus={pipelineStatusData?.status}
                error={pipelineStatusError}
                isLoading={isPipelineStatusLoading}
                isError={isPipelineStatusError}
                isSuccess={isPipelineStatusSuccess}
                requestStatus={requestStatus}
              />
            )}
          </Table.td>
          <Table.td>
            {isPipelineLoading || !pipeline ? (
              <ShimmeringLoader />
            ) : (
              pipeline.config.publication_name
            )}
          </Table.td>
          <Table.td>
            <div className="flex items-center justify-end gap-x-2">
              <RowMenu
                pipeline={pipeline}
                pipelineStatus={pipelineStatusData?.status}
                error={pipelineStatusError}
                isLoading={isPipelineStatusLoading}
                isError={isPipelineStatusError}
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
