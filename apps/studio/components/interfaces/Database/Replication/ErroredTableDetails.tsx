import { ExternalLink } from 'lucide-react'
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

const ContactSupportButton = ({ size = 'tiny' }: { size?: 'tiny' | 'small' | 'medium' }) => (
  <Button asChild type="default" size={size} icon={<ExternalLink className="w-3 h-3" />}>
    <Link href="https://supabase.com/support" target="_blank" rel="noopener noreferrer">
      Contact Support
    </Link>
  </Button>
)

export const ErroredTableDetails = ({
  state,
  tableName,
  tableId,
  projectRef,
  pipelineId,
}: ErroredTableDetailsProps) => {
  if (!isValidRetryPolicy(state.retry_policy)) {
    return (
      <div className="space-y-3" role="region" aria-label={`Error details for table ${tableName}`}>
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
          <div className="space-y-3">
            <div className="text-xs text-destructive-600">
              <span className="font-medium">Support required:</span> This error requires manual
              intervention from our support team. You can always recreate the pipeline if needed.
            </div>

            <Button asChild type="primary" size="tiny" icon={<ExternalLink className="w-3 h-3" />}>
              <Link href="https://supabase.com/support" target="_blank" rel="noopener noreferrer">
                Contact Support
              </Link>
            </Button>
          </div>
        )

      case 'manual_retry':
        return (
          <div className="space-y-3">
            <div className="text-xs text-brand-600">
              <span className="font-medium">Manual intervention available:</span> Fix the problem
              and then rollback.
            </div>

            <div className="flex items-center space-x-2">
              <RetryOptionsDropdown
                projectRef={projectRef}
                pipelineId={pipelineId}
                tableId={tableId}
                tableName={tableName}
              />
              <ContactSupportButton />
            </div>
          </div>
        )

      case 'timed_retry':
        return (
          <div className="space-y-3">
            <div className="text-xs text-brand-600">
              <span className="font-medium">Automatic retry scheduled:</span> The system will
              automatically retry this table.
            </div>

            <RetryCountdown nextRetryTime={state.retry_policy.next_retry} />
          </div>
        )

      default:
        return (
          <div className="space-y-3">
            <div className="text-xs text-warning-600">
              <span className="font-medium">Unknown retry policy</span>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-3" role="region" aria-label={`Error details for table ${tableName}`}>
      {state.solution && (
        <div className="text-xs text-foreground-light">
          <span className="font-medium">Solution:</span> {state.solution}
        </div>
      )}
      {renderRetryPolicyUI()}
    </div>
  )
}
