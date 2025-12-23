import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { TableState } from './ReplicationPipelineStatus/ReplicationPipelineStatus.types'
import { isValidRetryPolicy } from './ReplicationPipelineStatus/ReplicationPipelineStatus.utils'
import { RetryCountdown } from './RetryCountdown'

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
              <div className="min-w-4 mt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-destructive-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1 text-xs text-destructive-900">
                <p className="font-semibold mb-1">Action required to continue replication</p>
                <p className="text-destructive-800">
                  {state.solution}
                  {state.solution && !/[.!?]$/.test(state.solution.trim()) && '.'}
                </p>
                <p className="text-destructive-800 mt-2">
                  <strong>To fix this:</strong> Use the table actions menu on the right to restart
                  table replication from scratch. The pipeline will restart automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : retryPolicy === 'timed_retry' ? (
        <div className="flex flex-col text-foreground-lighter gap-y-3">
          <p className="text-xs">
            A retry will be triggered automatically by restarting the pipeline on this table.
          </p>
          <RetryCountdown nextRetryTime={state.retry_policy.next_retry} />
        </div>
      ) : null}
    </div>
  )
}
