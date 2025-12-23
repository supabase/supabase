import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { ErrorDetailsButton } from './ErrorDetailsButton'
import { TableState } from './ReplicationPipelineStatus/ReplicationPipelineStatus.types'
import { isValidRetryPolicy } from './ReplicationPipelineStatus/ReplicationPipelineStatus.utils'
import { ResetTableButton } from './ResetTableButton'
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
            . Alternatively, you may also recreate the pipeline.
          </p>
          <ErrorDetailsButton
            tableName={tableName}
            reason={state.reason}
            solution={state.solution}
          />
        </div>
      ) : retryPolicy === 'manual_retry' ? (
        <div className="flex flex-col gap-y-3">
          <div className="rounded-md border border-warning-400 bg-warning-50 px-3 py-3 space-y-2">
            <div className="flex items-start gap-x-2">
              <div className="min-w-4 mt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-warning-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1 text-xs text-warning-800">
                <p className="font-medium mb-1">Action required to continue replication</p>
                <p className="text-warning-700">
                  {state.solution}
                  {state.solution && !/[.!?]$/.test(state.solution.trim()) && '.'}
                </p>
                <p className="text-warning-700 mt-2">
                  <strong>To fix this:</strong> Reset the table below to restart replication from
                  scratch. The pipeline will restart automatically.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-x-2">
            <ResetTableButton tableId={tableId} tableName={tableName} variant="warning" />
            <ErrorDetailsButton
              tableName={tableName}
              reason={state.reason}
              solution={state.solution}
            />
          </div>
        </div>
      ) : retryPolicy === 'timed_retry' ? (
        <div className="flex flex-col text-foreground-lighter gap-y-3">
          <p className="text-xs">
            A retry will be triggered automatically by restarting the pipeline on this table.
          </p>
          <RetryCountdown nextRetryTime={state.retry_policy.next_retry} />
          <ErrorDetailsButton
            tableName={tableName}
            reason={state.reason}
            solution={state.solution}
          />
        </div>
      ) : null}
    </div>
  )
}
