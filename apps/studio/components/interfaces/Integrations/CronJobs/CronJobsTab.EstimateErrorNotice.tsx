import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

interface CronJobRunDetailsEstimateErrorNoticeProps {
  error?: Error | null
  isRetrying?: boolean
  onRetry?: () => void
}

export const CronJobRunDetailsEstimateErrorNotice = ({
  error,
  isRetrying,
  onRetry,
}: CronJobRunDetailsEstimateErrorNoticeProps) => {
  return (
    <Admonition
      type="warning"
      title="Error displaying cron jobs"
      description="There was an error displaying cron jobs. Please try again."
      className="max-w-3xl w-full"
    >
      <div className="space-y-3 text-sm">
        {error?.message && (
          <p className="text-foreground-light break-words">
            Error message: <code className="text-xs">{error.message}</code>
          </p>
        )}
        {onRetry && (
          <Button
            type="default"
            loading={isRetrying}
            disabled={isRetrying}
            className="mt-1"
            onClick={onRetry}
          >
            Retry check
          </Button>
        )}
      </div>
    </Admonition>
  )
}
