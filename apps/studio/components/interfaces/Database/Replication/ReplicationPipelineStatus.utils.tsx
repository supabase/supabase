import { ReplicationPipelineStatusData } from 'data/replication/pipeline-status-query'
import { Activity, Clock, HelpCircle, Loader2, XCircle } from 'lucide-react'
import { PipelineStatusRequestStatus } from 'state/replication-pipeline-request-status'
import { Badge } from 'ui'
import { getPipelineStateMessages } from './Pipeline.utils'
import { RetryPolicy, TableState } from './ReplicationPipelineStatus.types'

export const getStatusConfig = (state: TableState['state']) => {
  switch (state.name) {
    case 'queued':
      return {
        badge: <Badge variant="warning">Queued</Badge>,
        description: 'Waiting to start replication',
        color: 'text-warning-600',
      }
    case 'copying_table':
      return {
        badge: <Badge variant="brand">Copying</Badge>,
        description: 'Initial data copy in progress',
        color: 'text-brand-600',
      }
    case 'copied_table':
      return {
        badge: <Badge variant="success">Copied</Badge>,
        description: 'Initial copy completed',
        color: 'text-success-600',
      }
    case 'following_wal':
      return {
        badge: <Badge variant="success">Live</Badge>,
        description: `Replicating live changes`,
        color: 'text-success-600',
      }
    case 'error':
      return {
        badge: <Badge variant="destructive">Error</Badge>,
        description: <pre className="text-xs font-mono">{state.reason}</pre>,
        color: 'text-destructive-600',
      }
    default:
      return {
        badge: <Badge variant="warning">Unknown</Badge>,
        description: 'Unknown status',
        color: 'text-warning-600',
      }
  }
}

export const getDisabledStateConfig = ({
  requestStatus,
  statusName,
}: {
  requestStatus: PipelineStatusRequestStatus
  statusName?: ReplicationPipelineStatusData['status']['name']
}) => {
  const { title, message, badge } = getPipelineStateMessages(requestStatus, statusName)

  // Get icon and colors based on current state
  const isEnabling = requestStatus === PipelineStatusRequestStatus.EnableRequested
  const isDisabling = requestStatus === PipelineStatusRequestStatus.DisableRequested
  const isTransitioning = isEnabling || isDisabling

  const icon = isTransitioning ? (
    <Loader2 className="w-6 h-6 animate-spin" />
  ) : statusName === 'failed' ? (
    <XCircle className="w-6 h-6" />
  ) : statusName === 'starting' ? (
    <Clock className="w-6 h-6" />
  ) : statusName === 'unknown' ? (
    <HelpCircle className="w-6 h-6" />
  ) : (
    <Activity className="w-6 h-6" />
  )

  const colors = isEnabling
    ? {
        bg: 'bg-brand-50',
        text: 'text-brand-900',
        subtext: 'text-brand-700',
        iconBg: 'bg-brand-600',
        icon: 'text-white dark:text-black',
      }
    : isDisabling || statusName === 'starting' || statusName === 'unknown'
      ? {
          bg: 'bg-warning-50',
          text: 'text-warning-900',
          subtext: 'text-warning-700',
          iconBg: 'bg-warning-600',
          icon: 'text-white dark:text-black',
        }
      : statusName === 'failed'
        ? {
            bg: 'bg-destructive-50',
            text: 'text-destructive-900',
            subtext: 'text-destructive-700',
            iconBg: 'bg-destructive-600',
            icon: 'text-white dark:text-black',
          }
        : {
            bg: 'bg-surface-100',
            text: 'text-foreground',
            subtext: 'text-foreground-light',
            iconBg: 'bg-foreground-lighter',
            icon: 'text-white dark:text-black',
          }

  return { title, message, badge, icon, colors }
}

/**
 * Safely formats a retry timestamp with error handling
 */
export const formatRetryTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    return date.toLocaleString()
  } catch {
    return 'Invalid date'
  }
}

/**
 * Gets the appropriate retry policy display based on the policy type
 */
export const getRetryPolicyDisplay = (retryPolicy: RetryPolicy) => {
  switch (retryPolicy.policy) {
    case 'manual_retry':
      return {
        type: 'manual' as const,
        message: 'Manual retry available (endpoint pending implementation)',
        variant: 'warning' as const,
      }
    case 'timed_retry':
      return {
        type: 'timed' as const,
        message: `Next retry: ${formatRetryTimestamp('next_retry' in retryPolicy ? retryPolicy.next_retry : '')}`,
        variant: 'info' as const,
      }
    case 'no_retry':
      return {
        type: 'none' as const,
        message: 'Manual intervention required',
        variant: 'destructive' as const,
      }
    default:
      return {
        type: 'unknown' as const,
        message: 'Unknown retry policy',
        variant: 'warning' as const,
      }
  }
}
