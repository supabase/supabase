import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { TOOLTIP_UNDERLINE_CLASS_NAME } from './DetailSubtext'
import { getPipelineDisplayState, getStatusName } from './Pipeline.utils'
import type { PipelineDisplayType } from './Pipeline.utils'
import { PipelineStatusName } from './Replication.constants'
import { StateDot, type StateDotVariant } from './StateDot'
import { ReplicationPipelineStatusData } from '@/data/replication/pipeline-status-query'
import { PipelineStatusRequestStatus } from '@/state/replication-pipeline-request-status'
import type { ResponseError } from '@/types'

const VARIANT_BY_TYPE: Record<PipelineDisplayType, StateDotVariant> = {
  success: 'success',
  failure: 'destructive',
  loading: 'warning',
  idle: 'default',
}

interface PipelineStatePillProps {
  pipelineStatus: ReplicationPipelineStatusData['status'] | undefined
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  requestStatus?: PipelineStatusRequestStatus
  projectRef?: string
  pipelineId?: number
}

/**
 * Status of a pipeline as a dot and label. The label carries a dotted underline because its
 * explanation lives in the tooltip. Tooltips stay plain text (no links).
 */
export const PipelineStatePill = ({
  pipelineStatus,
  error,
  isLoading,
  isError,
  isSuccess,
  requestStatus,
}: PipelineStatePillProps) => {
  const statusName = getStatusName(pipelineStatus)
  const { type, message, label } = getPipelineDisplayState(requestStatus, statusName)

  const showLogsHint =
    isSuccess &&
    [PipelineStatusName.UNKNOWN, PipelineStatusName.FAILED].includes(
      statusName as PipelineStatusName
    )

  if (isLoading) return <ShimmeringLoader className="w-20" />

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <StateDot
          tabIndex={0}
          variant={isError ? 'default' : VARIANT_BY_TYPE[type]}
          isPulsing={!isError && type === 'loading'}
          labelClassName={cn('text-foreground-light', TOOLTIP_UNDERLINE_CLASS_NAME)}
        >
          {isError ? 'Unknown' : label}
        </StateDot>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        {isError
          ? `Unable to retrieve status: ${error?.message}`
          : showLogsHint
            ? `${message}. Check the logs for more information.`
            : message}
      </TooltipContent>
    </Tooltip>
  )
}
