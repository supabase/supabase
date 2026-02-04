import { useParams } from 'common'
import { AlertError } from 'components/ui/AlertError'
import { useDeleteDestinationPipelineMutation } from 'data/replication/delete-destination-pipeline-mutation'
import { useReplicationPipelineReplicationStatusQuery } from 'data/replication/pipeline-replication-status-query'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import { useReplicationPipelineVersionQuery } from 'data/replication/pipeline-version-query'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'
import { AnalyticsBucket, BigQuery, Database } from 'icons'
import { Minus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
import {
  Button,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  WarningIcon,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { DeleteDestination } from './DeleteDestination'
import { PIPELINE_ERROR_MESSAGES } from './Pipeline.utils'
import { PipelineStatus } from './PipelineStatus'
import { PipelineStatusName, STATUS_REFRESH_FREQUENCY_MS } from './Replication.constants'
import { RowMenu } from './RowMenu'
import { UpdateVersionModal } from './UpdateVersionModal'
import { useDestinationInformation } from './useDestinationInformation'

interface DestinationRowProps {
  destinationId: number
}

export const DestinationRow = ({ destinationId }: DestinationRowProps) => {
  const { ref: projectRef } = useParams()
  const [showDeleteDestinationForm, setShowDeleteDestinationForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showUpdateVersionModal, setShowUpdateVersionModal] = useState(false)

  const { type, statusName, destination, pipeline, pipelineStatus, pipelineFetcher } =
    useDestinationInformation({
      id: destinationId,
    })
  const {
    error: pipelineError,
    isPending: isPipelineLoading,
    isError: isPipelineError,
    isSuccess: isPipelineSuccess,
  } = pipelineFetcher
  const destinationName = destination?.name ?? ''

  const {
    error: pipelineStatusError,
    isPending: isPipelineStatusLoading,
    isError: isPipelineStatusError,
    isSuccess: isPipelineStatusSuccess,
  } = useReplicationPipelineStatusQuery(
    {
      projectRef,
      pipelineId: pipeline?.id,
    },
    { refetchInterval: STATUS_REFRESH_FREQUENCY_MS }
  )
  const { getRequestStatus, updatePipelineStatus } = usePipelineRequestStatus()
  const requestStatus = pipeline?.id
    ? getRequestStatus(pipeline.id)
    : PipelineStatusRequestStatus.None

  const { mutateAsync: stopPipeline } = useStopPipelineMutation()
  const { mutateAsync: deleteDestinationPipeline } = useDeleteDestinationPipelineMutation({})

  // Fetch table-level replication status to surface errors in list view
  const { data: replicationStatusData } = useReplicationPipelineReplicationStatusQuery(
    { projectRef, pipelineId: pipeline?.id },
    { refetchInterval: STATUS_REFRESH_FREQUENCY_MS }
  )
  const tableStatuses = replicationStatusData?.table_statuses ?? []
  const errorCount = tableStatuses.filter((t) => t.state?.name === 'error').length
  // Only show errors when pipeline is running (not when stopped or restarting)
  const isPipelineStopped = statusName === PipelineStatusName.STOPPED
  const isRestarting = requestStatus === PipelineStatusRequestStatus.RestartRequested
  const hasTableErrors = errorCount > 0 && !isPipelineStopped && !isRestarting

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
        <TableRow>
          <TableCell>
            {type === 'BigQuery' ? (
              <BigQuery size={18} className="text-foreground-light" />
            ) : type === 'Analytics Bucket' ? (
              <AnalyticsBucket size={18} className="text-foreground-light" />
            ) : (
              <Database size={18} className="text-foreground-light" />
            )}
          </TableCell>

          <TableCell className="max-w-[180px]">
            {isPipelineLoading ? (
              <ShimmeringLoader />
            ) : (
              <div>
                <p title={destinationName} className="truncate">
                  {destinationName}
                </p>
                <p className="text-foreground-lighter">
                  {type} (ID: {pipeline?.id})
                </p>
              </div>
            )}
          </TableCell>

          <TableCell>
            {isPipelineLoading || !pipeline ? (
              <ShimmeringLoader />
            ) : (
              <PipelineStatus
                pipelineStatus={pipelineStatus?.status}
                error={pipelineStatusError}
                isLoading={isPipelineStatusLoading}
                isError={isPipelineStatusError}
                isSuccess={isPipelineStatusSuccess}
                requestStatus={requestStatus}
                pipelineId={pipeline?.id}
              />
            )}
          </TableCell>

          <TableCell>
            <Minus size={18} className="text-foreground-lighter" />
          </TableCell>

          <TableCell>
            {isPipelineLoading || !pipeline ? (
              <ShimmeringLoader />
            ) : (
              pipeline.config.publication_name
            )}
          </TableCell>

          <TableCell>
            <div className="flex items-center justify-end gap-x-2">
              {hasTableErrors && (
                <Tooltip>
                  <TooltipTrigger>
                    <WarningIcon />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {errorCount} table{errorCount === 1 ? '' : 's'} encountered replication errors
                  </TooltipContent>
                </Tooltip>
              )}
              <Button asChild type="default" className="relative">
                <Link href={`/project/${projectRef}/database/replication/${pipeline?.id}`}>
                  View replication
                </Link>
              </Button>
              <RowMenu
                destinationId={destinationId}
                pipeline={pipeline}
                pipelineStatus={pipelineStatus?.status}
                error={pipelineStatusError}
                isLoading={isPipelineStatusLoading}
                isError={isPipelineStatusError}
                onDeleteClick={() => setShowDeleteDestinationForm(true)}
                hasUpdate={hasUpdate}
                onUpdateClick={() => setShowUpdateVersionModal(true)}
              />
            </div>
          </TableCell>
        </TableRow>
      )}

      <DeleteDestination
        visible={showDeleteDestinationForm}
        setVisible={setShowDeleteDestinationForm}
        onDelete={onDeleteClick}
        isLoading={isDeleting}
        name={destinationName}
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
