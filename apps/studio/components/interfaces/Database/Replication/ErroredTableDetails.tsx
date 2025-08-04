import { AlertTriangle, ExternalLink, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import { isValidRetryPolicy, TableState } from './ReplicationPipelineStatus.types'
import { RetryCountdown } from './RetryCountdown'
import { RetryOptionsDropdown } from './RetryOptionsDropdown'

interface ErroredTableDetailsProps {
  state: Extract<TableState['state'], { name: 'error' }>
  tableName: string
  tableId: number
  projectRef: string
  pipelineId: number
}

export const ErroredTableDetails = ({
  state,
  tableName,
  tableId,
  projectRef,
  pipelineId,
}: ErroredTableDetailsProps) => {
  // Validate retry policy before processing
  if (!isValidRetryPolicy(state.retry_policy)) {
    return (
      <div className="space-y-2" role="region" aria-label={`Error details for table ${tableName}`}>
        <div className="text-xs text-destructive-600">
          <span className="font-medium">Error:</span> {state.reason}
        </div>
        {state.solution && (
          <div className="text-xs text-foreground-light">
            <span className="font-medium">Solution:</span> {state.solution}
          </div>
        )}
        <div className="text-xs text-warning-600">
          <span className="font-medium">Invalid retry policy configuration</span>
        </div>
      </div>
    )
  }

  const renderRetryPolicyUI = () => {
    switch (state.retry_policy.policy) {
      case 'no_retry':
        return (
          <div className="space-y-2">
            <div className="bg-destructive-50 border border-destructive-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-destructive-800">
                    <span className="font-medium">Support required:</span> This error requires manual intervention from our support team.
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                type="outline"
                size="tiny"
                icon={<ExternalLink className="w-3 h-3" />}
                className="h-6 text-xs"
              >
                <Link
                  href="https://supabase.com/support"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contact Support
                </Link>
              </Button>
              <div className="text-xs text-foreground-lighter">or</div>
              <Button
                asChild
                type="outline"
                size="tiny"
                icon={<Trash2 className="w-3 h-3" />}
                className="h-6 text-xs text-destructive-600 border-destructive-300 hover:bg-destructive-50"
              >
                <Link href={`/project/${projectRef}/database/replication`}>
                  Recreate Pipeline
                </Link>
              </Button>
            </div>
          </div>
        )

      case 'manual_retry':
        return (
          <div className="space-y-2">
            <div className="text-xs text-brand-600">
              <span className="font-medium">Manual intervention available:</span> Choose how to fix this table.
            </div>
            <RetryOptionsDropdown
              projectRef={projectRef}
              pipelineId={pipelineId}
              tableId={tableId}
              tableName={tableName}
            />
          </div>
        )

      case 'timed_retry':
        return (
          <div className="space-y-2">
            <div className="text-xs text-brand-600">
              <span className="font-medium">Automatic retry scheduled:</span> The system will automatically retry this table.
            </div>
            <RetryCountdown nextRetryTime={state.retry_policy.next_retry} />
          </div>
        )

      default:
        return (
          <div className="text-xs text-warning-600">
            <span className="font-medium">Unknown retry policy</span>
          </div>
        )
    }
  }

  return (
    <div className="space-y-2" role="region" aria-label={`Error details for table ${tableName}`}>
      {/* Error reason */}
      <div className="text-xs text-destructive-600">
        <span className="font-medium">Error:</span> {state.reason}
      </div>
      
      {/* Solution (if provided) */}
      {state.solution && (
        <div className="text-xs text-foreground-light">
          <span className="font-medium">Solution:</span> {state.solution}
        </div>
      )}
      
      {/* Retry policy specific UI */}
      {renderRetryPolicyUI()}
    </div>
  )
}