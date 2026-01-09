import { ReplicationPipelineTableStatus } from '@/data/replication/pipeline-replication-status-query'
import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { CriticalIcon } from 'ui'
import { isValidRetryPolicy } from './ReplicationPipelineStatus/ReplicationPipelineStatus.utils'
import { RetryCountdown } from './RetryCountdown'

interface ErroredTableDetailsProps {
  table: ReplicationPipelineTableStatus
}

export const ErroredTableDetails = ({ table }: ErroredTableDetailsProps) => {
  const { ref: projectRef } = useParams()

  const state = table.state as Extract<ReplicationPipelineTableStatus['state'], { name: 'error' }>
  const tableName = table.table_name
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
        <div className="flex flex-col gap-y-3">
          <p className="text-xs text-foreground-lighter">
            This error requires manual intervention from our{' '}
            <InlineLink
              className="text-foreground-lighter hover:text-foreground"
              href={`/support?projectRef=${projectRef}&category=dashboard_bug&subject=Database%20replication%20error&error=${state.reason}`}
            >
              support
            </InlineLink>
            . Alternatively, you may also recreate the pipeline. Use the table actions menu on the
            right to view the full error details.
          </p>
        </div>
      ) : retryPolicy === 'manual_retry' ? (
        <div className="flex flex-col gap-y-3">
          <div className="rounded-md border border-destructive-400 bg-destructive-100 px-3 py-3 space-y-2">
            <div className="flex items-start gap-x-2">
              <CriticalIcon />
              <div className="flex-1 text-xs text-destructive-900">
                <p className="font-semibold mb-1">Action required to continue replication</p>
                <p className="text-foreground-light">
                  {state.solution}
                  {state.solution && !/[.!?]$/.test(state.solution.trim()) && '.'}
                </p>
                <p className="text-foreground-light mt-2">
                  Restart table replication from the table actions menu on the right. The pipeline
                  will restart automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : retryPolicy === 'timed_retry' ? (
        <div className="flex flex-col text-foreground-lighter gap-y-3">
          <p className="text-xs">
            Replication will retry automatically. The pipeline will restart to apply the retry.
          </p>
          <RetryCountdown nextRetryTime={state.retry_policy.next_retry} />
        </div>
      ) : null}
    </div>
  )
}
