import { useParams } from 'common'

import { isValidRetryPolicy } from './ReplicationPipelineStatus/ReplicationPipelineStatus.utils'
import { RetryCountdown } from './RetryCountdown'
import { InlineLink } from '@/components/ui/InlineLink'
import { ReplicationPipelineTableStatus } from '@/data/replication/pipeline-replication-status-query'

interface ErroredTableDetailsProps {
  table: ReplicationPipelineTableStatus
}

/**
 * What happens next for a table that failed, in one line. The error itself and how to fix it live
 * in ErrorDetailsDialog, reached from the row's View error action, so they aren't repeated here.
 */
export const ErroredTableDetails = ({ table }: ErroredTableDetailsProps) => {
  const { ref: projectRef } = useParams()

  const state = table.state as Extract<ReplicationPipelineTableStatus['state'], { name: 'error' }>
  const tableName = `${table.schema}.${table.name}`

  if (!isValidRetryPolicy(state.retry_policy)) {
    return (
      <p
        role="region"
        aria-label={`Recovery for table ${tableName}`}
        className="text-xs text-foreground-lighter"
      >
        Invalid retry policy configuration
      </p>
    )
  }

  const retryPolicy = state.retry_policy.policy

  if (retryPolicy === 'no_retry') {
    return (
      <p
        role="region"
        aria-label={`Recovery for table ${tableName}`}
        className="text-xs text-foreground-lighter"
      >
        This error needs manual intervention from{' '}
        <InlineLink
          className="text-foreground-lighter hover:text-foreground"
          href={`/support?projectRef=${projectRef}&category=dashboard_bug&subject=Database%20replication%20error&error=${encodeURIComponent(state.reason ?? '')}`}
        >
          support
        </InlineLink>
        , or you can recreate the pipeline.
      </p>
    )
  }

  if (retryPolicy === 'manual_retry') {
    return (
      <p
        role="region"
        aria-label={`Recovery for table ${tableName}`}
        className="text-xs text-foreground-lighter"
      >
        Replication stays paused until you reset this table.
      </p>
    )
  }

  return (
    <div
      role="region"
      aria-label={`Recovery for table ${tableName}`}
      className="flex flex-col gap-y-1 text-xs text-foreground-lighter"
    >
      <p>Replication retries automatically.</p>
      <RetryCountdown nextRetryTime={state.retry_policy.next_retry} />
    </div>
  )
}
