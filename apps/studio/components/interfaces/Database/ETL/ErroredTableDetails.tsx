import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { TableState } from './ReplicationPipelineStatus/ReplicationPipelineStatus.types'
import { isValidRetryPolicy } from './ReplicationPipelineStatus/ReplicationPipelineStatus.utils'
import { RetryCountdown } from './RetryCountdown'
import { RetryOptionsDropdown } from './RetryOptionsDropdown'

interface ErroredTableDetailsProps {
  state: Extract<TableState['state'], { name: 'error' }>
  tableName: string
  tableId: number
}

export const ErroredTableDetails = ({ state, tableName, tableId }: ErroredTableDetailsProps) => {
  const { ref: projectRef } = useParams()
  const retryPolicy = state.retry_policy.policy

  if (!isValidRetryPolicy(state.retry_policy)) {
    return (
      <div
        role="region"
        className="flex flex-col gap-y-3"
        aria-label={`Error details for table ${tableName}`}
      >
        {state.solution && <div className="text-xs text-foreground-light">{state.solution}</div>}
        <div className="text-xs text-foreground-lighter">Invalid retry policy configuration</div>
      </div>
    )
  }

  return (
    <div role="region" aria-label={`Error details for table ${tableName}`}>
      {retryPolicy === 'no_retry' ? (
        <p className="text-xs text-foreground-lighter">
          This error requires manual intervention from our{' '}
          <InlineLink
            className="text-foreground-lighter hover:text-foreground"
            href={`/support?projectRef=${projectRef}&category=dashboard_bug&subject=Database%20replication%20error&error=${state.reason}`}
          >
            support
          </InlineLink>
          . Alternatively, you may also recreate the pipeline.
        </p>
      ) : retryPolicy === 'manual_retry' ? (
        <div className="flex flex-col gap-y-2 text-foreground-lighter">
          <p className="text-xs">{state.solution}. You may thereafter rollback the pipeline.</p>
          <RetryOptionsDropdown tableId={tableId} tableName={tableName} />
        </div>
      ) : retryPolicy === 'timed_retry' ? (
        <div className="flex flex-col text-foreground-lighter">
          <p className="text-xs">
            A retry will be triggered automatically by restarting the pipeline on this table.
          </p>
          <RetryCountdown nextRetryTime={state.retry_policy.next_retry} />
        </div>
      ) : null}
    </div>
  )
}
