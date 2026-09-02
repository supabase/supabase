import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { TOOLTIP_UNDERLINE_CLASS_NAME } from './DetailSubtext'
import { getPipelineDisplayState, getStatusName } from './Pipeline.utils'
import type { PipelineDisplayType } from './Pipeline.utils'
import { PipelineStatusName } from './Replication.constants'
import { InlineLink } from '@/components/ui/InlineLink'
import { ReplicationPipelineStatusData } from '@/data/replication/pipeline-status-query'
import { PipelineStatusRequestStatus } from '@/state/replication-pipeline-request-status'
import type { ResponseError } from '@/types'

const DOT_CLASS_NAME: Record<PipelineDisplayType, string> = {
  success: 'bg-brand',
  failure: 'bg-destructive',
  loading: 'bg-warning',
  idle: 'bg-foreground-muted',
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
 * explanation lives in the tooltip.
 */
export const PipelineStatePill = ({
  pipelineStatus,
  error,
  isLoading,
  isError,
  isSuccess,
  requestStatus,
  projectRef,
  pipelineId,
}: PipelineStatePillProps) => {
  const statusName = getStatusName(pipelineStatus)
  const { type, message, label } = getPipelineDisplayState(requestStatus, statusName)

  const pipelineLogsUrl = `/project/${projectRef}/logs/replication-logs${
    pipelineId ? `?f=${encodeURIComponent(JSON.stringify({ pipeline_id: pipelineId }))}` : ''
  }`
  const showLogsCTA = [PipelineStatusName.UNKNOWN, PipelineStatusName.FAILED].includes(
    statusName as PipelineStatusName
  )

  if (isLoading) return <ShimmeringLoader className="w-20" />

  const dotClassName = isError ? DOT_CLASS_NAME.idle : DOT_CLASS_NAME[type]
  const isPulsing = !isError && type === 'loading'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-2" tabIndex={0}>
          <span className="relative flex h-2 w-2">
            {isPulsing && (
              <span
                className={cn(
                  'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                  dotClassName
                )}
              />
            )}
            <span className={cn('relative inline-flex h-2 w-2 rounded-full', dotClassName)} />
          </span>
          <span className={cn('text-foreground-light', TOOLTIP_UNDERLINE_CLASS_NAME)}>
            {isError ? 'Unknown' : label}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        {isError ? (
          `Unable to retrieve status: ${error?.message}`
        ) : (
          <>
            {message}{' '}
            {isSuccess && showLogsCTA && (
              <>
                Check the <InlineLink href={pipelineLogsUrl}>logs</InlineLink> for more information.
              </>
            )}
          </>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
