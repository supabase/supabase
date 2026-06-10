import { useParams } from 'common'
import { AnalyticsBucket, BigQuery, Database } from 'icons'
import { Minus, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  WarningIcon,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { DeleteDestination } from './DeleteDestination'
import { PipelineStatus } from './PipelineStatus'
import { PipelineStatusName, STATUS_REFRESH_FREQUENCY_MS } from './Replication.constants'
import {
  getFormattedLagValue,
  getSlotLossSeverity,
} from './ReplicationPipelineStatus/ReplicationPipelineStatus.utils'
import { RowMenu } from './RowMenu'
import { UpdateVersionModal } from './UpdateVersionModal'
import { useDestinationInformation } from './useDestinationInformation'
import { AlertError } from '@/components/ui/AlertError'
import { useDeleteDestinationPipelineMutation } from '@/data/replication/delete-destination-pipeline-mutation'
import { useReplicationPipelineReplicationStatusQuery } from '@/data/replication/pipeline-replication-status-query'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { useReplicationPipelineVersionQuery } from '@/data/replication/pipeline-version-query'
import { useStopPipelineMutation } from '@/data/replication/stop-pipeline-mutation'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'
import { type ResponseError } from '@/types'

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
  const {
    data: replicationStatusData,
    isPending: isReplicationStatusLoading,
    isError: isReplicationStatusError,
  } = useReplicationPipelineReplicationStatusQuery(
    { projectRef, pipelineId: pipeline?.id },
    { refetchInterval: STATUS_REFRESH_FREQUENCY_MS }
  )
  const tableStatuses = replicationStatusData?.table_statuses ?? []
  const errorCount = tableStatuses.filter((t) => t.state?.name === 'error').length
  const applyLag = replicationStatusData?.apply_lag
  // Show the byte-based slot lag (WAL the destination hasn't confirmed flushing yet). The
  // time-based flush_lag from pg_stat_replication is routinely NULL for logical slots that are
  // idle or don't report timed feedback, whereas confirmed_flush_lsn_bytes is always populated.
  const lagBytes = applyLag?.confirmed_flush_lsn_bytes
  const lag = getFormattedLagValue('bytes', lagBytes)
  const isCaughtUp = lagBytes === 0
  // Severity is the slot-loss risk: how close the retained WAL is to exhausting the slot's safe
  // headroom, not the lag size itself. safe_wal_size_bytes of 0 means "no limit / unknown".
  const lagSeverity = getSlotLossSeverity(
    applyLag?.restart_lsn_bytes,
    applyLag?.safe_wal_size_bytes
  )
  const safeWalSize = getFormattedLagValue('bytes', applyLag?.safe_wal_size_bytes)
  // The time-based lag is a nice-to-have shown alongside the bytes when Postgres reports it.
  const flushLagMs = applyLag?.flush_lag
  const hasTimeLag = typeof flushLagMs === 'number' && !Number.isNaN(flushLagMs)
  const timeLag = getFormattedLagValue('duration', flushLagMs)
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
      return toast.error('No pipeline found')
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
      toast.error(`Failed to delete destination: ${(error as ResponseError).message}`)
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
        <AlertError error={pipelineError} subject="Failed to retrieve pipeline information" />
      )}
      {isPipelineSuccess && (
        <TableRow>
          <TableCell>
            {type === 'BigQuery' ? (
              <BigQuery size={18} className="text-foreground-light" />
            ) : type === 'Analytics Bucket' ? (
              <AnalyticsBucket size={18} className="text-foreground-light" />
            ) : type === 'DuckLake' ? (
              <Database size={18} className="text-foreground-light" />
            ) : (
              <Database size={18} className="text-foreground-light" />
            )}
          </TableCell>

          <TableCell className="max-w-[180px]">
            {isPipelineLoading ? (
              <ShimmeringLoader />
            ) : (
              <div>
                <p>
                  {type} (ID: {pipeline?.id})
                </p>
                <p className="text-foreground-lighter">{destinationName}</p>
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
            {!pipeline ? (
              <Minus size={18} className="text-foreground-lighter" />
            ) : isReplicationStatusLoading ? (
              <ShimmeringLoader />
            ) : isReplicationStatusError || !applyLag ? (
              <Minus size={18} className="text-foreground-lighter" />
            ) : isCaughtUp ? (
              <p className="text-foreground-light">Caught up</p>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p
                    className={cn(
                      'w-fit cursor-help flex items-center gap-x-1.5',
                      lagSeverity === 'critical'
                        ? 'text-destructive'
                        : lagSeverity === 'warning'
                          ? 'text-warning'
                          : ''
                    )}
                  >
                    {lagSeverity !== 'normal' && <TriangleAlert size={14} className="shrink-0" />}
                    {lag.display}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="flex flex-col gap-y-1 max-w-[260px]">
                  <span>
                    {lag.display} waiting to sync{hasTimeLag ? `, ${timeLag.display} behind` : ''}.
                  </span>
                  {lagSeverity === 'warning' && (
                    <span className="text-foreground-light">
                      It's falling behind — about {safeWalSize.display} of room left before syncing
                      pauses.
                    </span>
                  )}
                  {lagSeverity === 'critical' && (
                    <span className="text-foreground-light">
                      It's far behind. If it doesn't catch up soon, syncing pauses and this
                      destination has to be set up again.
                    </span>
                  )}
                </TooltipContent>
              </Tooltip>
            )}
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
