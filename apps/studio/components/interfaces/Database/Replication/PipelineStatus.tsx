import { useParams } from 'common'
import { Loader2 } from 'lucide-react'
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { getPipelineDisplayState, getStatusName } from './Pipeline.utils'
import { PipelineStatusName } from './Replication.constants'
import { InlineLink } from '@/components/ui/InlineLink'
import { ReplicationPipelineStatusData } from '@/data/replication/pipeline-status-query'
import { PipelineStatusRequestStatus } from '@/state/replication-pipeline-request-status'
import type { ResponseError } from '@/types'

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

  const statusName = getStatusName(pipelineStatus)
  const displayState = getPipelineDisplayState(requestStatus, statusName)
  const { type, message, label } = displayState

  const pipelineLogsUrl = pipelineId
    ? `/project/${ref}/logs/replication-logs?f=${encodeURIComponent(
        JSON.stringify({ pipeline_id: pipelineId })
      )}`
    : `/project/${ref}/logs/replication-logs`

  const showLogsCTA = [PipelineStatusName.UNKNOWN, PipelineStatusName.FAILED].includes(
    statusName as PipelineStatusName
  )

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
                  type === 'failure' ? 'destructive' : type === 'success' ? 'success' : 'default'
                }
              >
                {label}
              </Badge>
              {type === 'loading' && <Loader2 className="animate-spin w-3 h-3" />}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {message}{' '}
            {showLogsCTA && (
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
