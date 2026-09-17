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
  requestStatus: PipelineStatusRequestStatus
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
  const isRequestPending = requestStatus !== PipelineStatusRequestStatus.None
  const shouldShowError = isError && !isRequestPending

  const shouldShowLogsHint =
    isSuccess &&
    !isRequestPending &&
    [PipelineStatusName.UNKNOWN, PipelineStatusName.FAILED].includes(
      statusName as PipelineStatusName
    )

  if (isLoading && !isRequestPending) {
    return (
      <span className="inline-flex" aria-live="polite" aria-atomic="true">
        <span className="sr-only">Loading pipeline status</span>
        <ShimmeringLoader className="w-20" />
      </span>
    )
  }

  let tooltipMessage = message
  if (shouldShowError) {
    tooltipMessage = `Unable to retrieve status: ${error?.message}`
  } else if (shouldShowLogsHint) {
    tooltipMessage = `${message}. Check the logs for more information.`
  }

  return (
    <span className="inline-flex" aria-live="polite" aria-atomic="true">
      <Tooltip>
        <TooltipTrigger asChild>
          <StateDot
            tabIndex={0}
            variant={shouldShowError ? 'default' : VARIANT_BY_TYPE[type]}
            isPulsing={!shouldShowError && type === 'loading'}
            labelClassName={cn('text-foreground-light', TOOLTIP_UNDERLINE_CLASS_NAME)}
          >
            {shouldShowError ? 'Unknown' : label}
          </StateDot>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {tooltipMessage}
          {isError && isRequestPending && ` Unable to refresh status: ${error?.message}.`}
        </TooltipContent>
      </Tooltip>
    </span>
  )
}
