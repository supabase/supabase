import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ReplicationPipelinesData } from 'data/replication/pipelines-query'
import { ResponseError } from 'types'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import RowMenu from './RowMenu'
import PipelineStatus from './PipelineStatus'
import { useParams } from 'common'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'
import { useDeleteSinkMutation } from 'data/replication/delete-sink-mutation'
import { useDeletePipelineMutation } from 'data/replication/delete-pipeline-mutation'
import DeleteDestination from './DeleteDestination'
import DestinationPanel from './DestinationPanel'

export type Pipeline = ReplicationPipelinesData['pipelines'][0]

interface DestinationRowProps {
  sourceId: number | undefined
  sinkId: number
  sinkName: string
  type: string
  pipeline: Pipeline | undefined
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
}

const DestinationRow = ({
  sourceId,
  sinkId,
  sinkName,
  type,
  pipeline,
  error: pipelineError,
  isLoading: isPipelineLoading,
  isError: isPipelineError,
  isSuccess: isPipelineSuccess,
}: DestinationRowProps) => {
  const { ref: projectRef } = useParams()
  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)
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
    { refetchInterval }
  )
  const [requestStatus, setRequestStatus] = useState<
    'None' | 'EnableRequested' | 'DisableRequested'
  >('None')
  const { mutateAsync: startPipeline } = useStartPipelineMutation()
  const { mutateAsync: stopPipeline } = useStopPipelineMutation()
  const pipelineStatus = pipelineStatusData?.status
  if (
    (requestStatus === 'EnableRequested' && pipelineStatus === 'Started') ||
    (requestStatus === 'DisableRequested' && pipelineStatus === 'Stopped')
  ) {
    setRefetchInterval(false)
    setRequestStatus('None')
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
    setRequestStatus('EnableRequested')
    setRefetchInterval(5000)
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
    setRequestStatus('DisableRequested')
    setRefetchInterval(5000)
  }
  const { mutateAsync: deleteSink } = useDeleteSinkMutation({})
  const { mutateAsync: deletePipeline } = useDeletePipelineMutation({
    onSuccess: (res) => {
      toast.success('Successfully deleted destination')
    },
  })

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
      await deletePipeline({ projectRef, pipelineId: pipeline.id })
      await deleteSink({ projectRef, sinkId })
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
            {isPipelineLoading ? <ShimmeringLoader></ShimmeringLoader> : sinkName}
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
              pipeline.publication_name
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
        name={sinkName}
      />
      <DestinationPanel
        visible={showEditDestinationPanel}
        onClose={() => setShowEditDestinationPanel(false)}
        sourceId={sourceId}
        existingDestination={{
          sourceId,
          sinkId,
          pipelineId: pipeline?.id,
          enabled: false,
        }}
      />
    </>
  )
}

export default DestinationRow
