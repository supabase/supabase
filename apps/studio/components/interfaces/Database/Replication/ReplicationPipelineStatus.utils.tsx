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
        color: 'text-warning',
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
        color: 'text-warning',
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
  const isEnabling = requestStatus === PipelineStatusRequestStatus.StartRequested
  const isDisabling = requestStatus === PipelineStatusRequestStatus.StopRequested
  const isRestarting = requestStatus === PipelineStatusRequestStatus.RestartRequested
  const isTransitioning = isEnabling || isDisabling || isRestarting

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

  const colors =
    isEnabling || isRestarting
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

export const isValidRetryPolicy = (policy: any): policy is RetryPolicy => {
  if (!policy || typeof policy !== 'object' || !policy.policy) return false

  switch (policy.policy) {
    case 'no_retry':
    case 'manual_retry':
      return true
    case 'timed_retry':
      return typeof policy.next_retry === 'string'
    default:
      return false
  }
}
