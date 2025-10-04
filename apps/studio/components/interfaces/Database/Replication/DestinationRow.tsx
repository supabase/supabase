import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { useDeleteDestinationPipelineMutation } from 'data/replication/delete-destination-pipeline-mutation'
import { useReplicationPipelineReplicationStatusQuery } from 'data/replication/pipeline-replication-status-query'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import { useReplicationPipelineVersionQuery } from 'data/replication/pipeline-version-query'
import { Pipeline } from 'data/replication/pipelines-query'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'
import { AlertCircle } from 'lucide-react'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
import { ResponseError } from 'types'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { DeleteDestination } from './DeleteDestination'
import { DestinationPanel } from './DestinationPanel'
import { getStatusName, PIPELINE_ERROR_MESSAGES } from './Pipeline.utils'
import { PipelineStatus } from './PipelineStatus'
import { PipelineStatusName, STATUS_REFRESH_FREQUENCY_MS } from './Replication.constants'
import { RowMenu } from './RowMenu'
import { UpdateVersionModal } from './UpdateVersionModal'

interface DestinationRowProps {
  sourceId?: number
  destinationId: number
  destinationName: string
  type: string
  pipeline?: Pipeline
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
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
}: DestinationRowProps) => {
  const { ref: projectRef } = useParams()
  const [showDeleteDestinationForm, setShowDeleteDestinationForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEditDestinationPanel, setShowEditDestinationPanel] = useState(false)
  const [showUpdateVersionModal, setShowUpdateVersionModal] = useState(false)

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
    { refetchInterval: STATUS_REFRESH_FREQUENCY_MS }
  )
  const { getRequestStatus, updatePipelineStatus, setRequestStatus } = usePipelineRequestStatus()
  const requestStatus = pipeline?.id
    ? getRequestStatus(pipeline.id)
    : PipelineStatusRequestStatus.None

  const { mutateAsync: stopPipeline } = useStopPipelineMutation()
  const { mutateAsync: deleteDestinationPipeline } = useDeleteDestinationPipelineMutation({})

  const pipelineStatus = pipelineStatusData?.status
  const statusName = getStatusName(pipelineStatus)

  // Fetch table-level replication status to surface errors in list view
  const { data: replicationStatusData } = useReplicationPipelineReplicationStatusQuery(
    { projectRef, pipelineId: pipeline?.id },
    { refetchInterval: STATUS_REFRESH_FREQUENCY_MS }
  )
  const tableStatuses = replicationStatusData?.table_statuses ?? []
  const errorCount = tableStatuses.filter((t) => t.state?.name === 'error').length
  const hasTableErrors = errorCount > 0

  // Check if a newer pipeline version is available (one-time check cached for session)
  const { data: versionData } = useReplicationPipelineVersionQuery({
    projectRef,
    pipelineId: pipeline?.id,
  })
  const hasUpdate = Boolean(versionData?.new_version)

  const onDeleteClick = async () => {
    if (!projectRef) {
      return console.error('Project ref is required')
    }
    if (!pipeline) {
      return toast.error(PIPELINE_ERROR_MESSAGES.NO_PIPELINE_FOUND)
    }

    try {
      setIsDeleting(true)
      await stopPipeline({ projectRef, pipelineId: pipeline.id })
      await deleteDestinationPipeline({
        projectRef,
        destinationId: destinationId,
        pipelineId: pipeline.id,
      })
      // Close dialog after successful deletion
      setShowDeleteDestinationForm(false)
      toast.success(`Deleted destination "${destinationName}"`)
    } catch (error) {
      toast.error(PIPELINE_ERROR_MESSAGES.DELETE_DESTINATION)
    } finally {
      setIsDeleting(false)
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
        <Table.tr>
          <Table.td>
            {isPipelineLoading ? (
              <ShimmeringLoader />
            ) : pipeline?.id ? (
              <Tooltip>
                <TooltipTrigger>
                  <span className="cursor-default">{destinationName}</span>
                </TooltipTrigger>
                <TooltipContent side="bottom">Pipeline ID: {pipeline.id}</TooltipContent>
              </Tooltip>
            ) : (
              destinationName
            )}
          </Table.td>
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
                pipelineId={pipeline?.id}
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
              <Button asChild type="default" className="relative">
                <Link href={`/project/${projectRef}/database/replication/${pipeline?.id}`}>
                  <span className="inline-flex items-center gap-2">
                    <span>View status</span>
                    {hasTableErrors && (
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle size={14} />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {errorCount} table{errorCount === 1 ? '' : 's'} have replication errors
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </Link>
              </Button>
              <RowMenu
                pipeline={pipeline}
                pipelineStatus={pipelineStatusData?.status}
                error={pipelineStatusError}
                isLoading={isPipelineStatusLoading}
                isError={isPipelineStatusError}
                onDeleteClick={() => setShowDeleteDestinationForm(true)}
                onEditClick={() => setShowEditDestinationPanel(true)}
                hasUpdate={hasUpdate}
                onUpdateClick={() => setShowUpdateVersionModal(true)}
              />
            </div>
          </Table.td>
        </Table.tr>
      )}

      <DeleteDestination
        visible={showDeleteDestinationForm}
        setVisible={setShowDeleteDestinationForm}
        onDelete={onDeleteClick}
        isLoading={isDeleting}
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
          enabled:
            statusName === PipelineStatusName.STARTED || statusName === PipelineStatusName.FAILED,
          statusName,
        }}
      />

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
