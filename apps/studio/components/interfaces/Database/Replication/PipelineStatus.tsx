import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { ReplicationPipelineStatusData } from 'data/replication/pipeline-status-query'
import { PipelineStatusRequestStatus } from 'state/replication-pipeline-request-status'
import type { ResponseError } from 'types'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { StatusBadge, type StatusBadgeStatus } from 'ui-patterns/StatusBadge'

import { getPipelineStateMessages } from './Pipeline.utils'
import { PipelineStatusName } from './Replication.constants'

interface PipelineStatusProps {
  pipelineStatus: ReplicationPipelineStatusData['status'] | undefined
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  requestStatus?: PipelineStatusRequestStatus
  pipelineId?: number
}

export const PipelineStatus = ({
  pipelineStatus,
  error,
  isLoading,
  isError,
  isSuccess,
  requestStatus,
  pipelineId,
}: PipelineStatusProps) => {
  const { ref } = useParams()

  // Map backend statuses to UX-friendly display
  const getStatusConfig = (): {
    label: string
    status: StatusBadgeStatus
    tooltip: string
  } => {
    const statusName =
      pipelineStatus && typeof pipelineStatus === 'object' && 'name' in pipelineStatus
        ? pipelineStatus.name
        : undefined

    // Get consistent tooltip message using the same logic as other components
    const stateMessages = getPipelineStateMessages(requestStatus, statusName)

    // Show optimistic request state while backend still reports steady states
    switch (requestStatus) {
      case PipelineStatusRequestStatus.RestartRequested:
        return { label: 'Restarting', status: 'pending', tooltip: stateMessages.message }
      case PipelineStatusRequestStatus.StartRequested:
        return { label: 'Starting', status: 'pending', tooltip: stateMessages.message }
      case PipelineStatusRequestStatus.StopRequested:
        return { label: 'Stopping', status: 'pending', tooltip: stateMessages.message }
    }

    if (pipelineStatus && typeof pipelineStatus === 'object' && 'name' in pipelineStatus) {
      switch (pipelineStatus.name) {
        case PipelineStatusName.FAILED:
          return { label: 'Failed', status: 'failure', tooltip: stateMessages.message }
        case PipelineStatusName.STARTING:
          return { label: 'Starting', status: 'pending', tooltip: stateMessages.message }
        case PipelineStatusName.STARTED:
          return { label: 'Running', status: 'success', tooltip: stateMessages.message }
        case PipelineStatusName.STOPPED:
          return { label: 'Stopped', status: 'inactive', tooltip: stateMessages.message }
        case PipelineStatusName.STOPPING:
          return { label: 'Stopping', status: 'pending', tooltip: stateMessages.message }
        default:
          return { label: 'Unknown', status: 'unknown', tooltip: stateMessages.message }
      }
    }

    // Fallback for undefined or invalid status
    return {
      label: 'Unknown',
      status: 'unknown',
      tooltip: 'Pipeline status is unclear - check logs for details',
    }
  }

  const { status, tooltip, label } = getStatusConfig()

  const pipelineLogsUrl = pipelineId
    ? `/project/${ref}/logs/replication-logs?f=${encodeURIComponent(
        JSON.stringify({ pipeline_id: pipelineId })
      )}`
    : `/project/${ref}/logs/replication-logs`

  return (
    <>
      {isLoading && <ShimmeringLoader />}

      {isError && (
        <Tooltip>
          <TooltipTrigger asChild>
            <StatusBadge status="unknown" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-64 text-center">
            Unable to retrieve status: {error?.message}
          </TooltipContent>
        </Tooltip>
      )}

      {isSuccess && (
        <Tooltip>
          <TooltipTrigger asChild>
            <StatusBadge status={status}>{label}</StatusBadge>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {tooltip}{' '}
            {['unknown', 'failed'].includes(pipelineStatus?.name ?? '') && (
              <>
                Check the <InlineLink href={pipelineLogsUrl}>logs</InlineLink> for more information.
              </>
            )}
          </TooltipContent>
        </Tooltip>
      )}
    </>
  )
}
