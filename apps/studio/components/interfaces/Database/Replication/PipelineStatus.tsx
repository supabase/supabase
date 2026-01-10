import { Loader2 } from 'lucide-react'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { ReplicationPipelineStatusData } from 'data/replication/pipeline-status-query'
import { PipelineStatusRequestStatus } from 'state/replication-pipeline-request-status'
import type { ResponseError } from 'types'
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
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
    type?: 'failure' | 'warning' | 'loading' | 'success' | 'idle'
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
        return { label: 'Restarting', type: 'loading', tooltip: stateMessages.message }
      case PipelineStatusRequestStatus.StartRequested:
        return { label: 'Starting', type: 'loading', tooltip: stateMessages.message }
      case PipelineStatusRequestStatus.StopRequested:
        return { label: 'Stopping', type: 'loading', tooltip: stateMessages.message }
    }

    if (pipelineStatus && typeof pipelineStatus === 'object' && 'name' in pipelineStatus) {
      switch (pipelineStatus.name) {
        case PipelineStatusName.FAILED:
          return { label: 'Failed', type: 'failure', tooltip: stateMessages.message }
        case PipelineStatusName.STARTING:
          return { label: 'Starting', type: 'loading', tooltip: stateMessages.message }
        case PipelineStatusName.STARTED:
          return { label: 'Running', type: 'success', tooltip: stateMessages.message }
        case PipelineStatusName.STOPPED:
          return { label: 'Stopped', type: 'idle', tooltip: stateMessages.message }
        case PipelineStatusName.STOPPING:
          return { label: 'Stopping', type: 'loading', tooltip: stateMessages.message }
        default:
          return { label: 'Unknown', type: 'idle', tooltip: stateMessages.message }
      }
    }

    // Fallback for undefined or invalid status
    return {
      label: 'Unknown',
      type: 'idle',
      tooltip: 'Pipeline status is unclear - check logs for details',
    }
  }

  const { type, tooltip, label } = getStatusConfig()

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
          <TooltipTrigger>
            <Badge variant="default">Unknown</Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-64 text-center">
            Unable to retrieve status: {error?.message}
          </TooltipContent>
        </Tooltip>
      )}

      {isSuccess && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-x-2">
              <Badge
                variant={
                  type === 'failure'
                    ? 'destructive'
                    : type === 'warning'
                      ? 'warning'
                      : type === 'success'
                        ? 'success'
                        : 'default'
                }
              >
                {label}
              </Badge>
              {type === 'loading' && <Loader2 className="animate-spin w-3 h-3" />}
            </div>
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
