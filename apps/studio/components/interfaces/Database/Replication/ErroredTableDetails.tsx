import { useParams } from 'common'

import { isValidRetryPolicy } from './ReplicationPipelineStatus/ReplicationPipelineStatus.utils'
import { RetryCountdown } from './RetryCountdown'
import { InlineLink } from '@/components/ui/InlineLink'
import { ReplicationPipelineTableStatus } from '@/data/replication/pipeline-replication-status-query'

interface ErroredTableDetailsProps {
  table: ReplicationPipelineTableStatus
}

/**
 * What happens next for a table that failed, as the second sentence of the row's status line, so
 * it ends in a period. The error and how to fix it live in ErrorDetailsDialog, via View error.
 */
export const ErroredTableDetails = ({ table }: ErroredTableDetailsProps) => {
  const { ref: projectRef } = useParams()
  const state = table.state as Extract<ReplicationPipelineTableStatus['state'], { name: 'error' }>

  if (!isValidRetryPolicy(state.retry_policy)) return <>Retry settings are invalid.</>

  switch (state.retry_policy.policy) {
    case 'timed_retry':
      return <RetryCountdown nextRetryTime={state.retry_policy.next_retry} />
    case 'manual_retry':
      return <>Reset this table to resume.</>
    case 'no_retry':
      return (
        <>
          Needs{' '}
          <InlineLink
            className="text-foreground-lighter hover:text-foreground"
            href={`/support?projectRef=${projectRef}&category=dashboard_bug&subject=Database%20replication%20error&error=${encodeURIComponent(state.reason ?? '')}`}
          >
            support
          </InlineLink>
          , or recreate the pipeline.
        </>
      )
  }
}
