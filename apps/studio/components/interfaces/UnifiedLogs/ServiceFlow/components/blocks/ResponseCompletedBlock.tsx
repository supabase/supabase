import { memo } from 'react'
import { Clock } from 'lucide-react'
import { StyledIcon } from '../shared/TimelineStep'
import { EventMessage } from '../shared/EventMessage'
import { ColumnSchema } from '../../../UnifiedLogs.schema'

interface ResponseCompletedBlockProps {
  data: ColumnSchema
  enrichedData?: Record<string, any>
}

// Response (final step) - Shows completion details for HTTP or database operations
export const MemoizedResponseCompletedBlock = memo(function ResponseCompletedBlock({
  data,
  enrichedData,
}: ResponseCompletedBlockProps) {
  // Check if this is a postgres log
  const isPostgresLog = (enrichedData?.log_type || data?.log_type) === 'postgres'

  // HTTP response handling
  const hasError = data?.status && Number(data.status) >= 400
  const responseTime = enrichedData?.response_time_ms || enrichedData?.duration_ms
  const status = Number(data?.status)

  // Postgres operation handling
  const eventMessage = enrichedData?.event_message || (data as any)?.event_message
  const severity = enrichedData?.error_severity
  const hasPostgresError = severity && ['error', 'fatal'].includes(severity.toLowerCase())

  return (
    <div>
      <div className="flex items-center justify-between py-0 px-2">
        <div className="flex items-center gap-2 text-sm text-foreground-light">
          <StyledIcon icon={Clock} title="Response" />
          <span>{isPostgresLog ? 'Operation Result' : 'Response'}</span>
        </div>

        {/* Status display */}
        {isPostgresLog
          ? // Postgres status
            severity && (
              <span
                className={`text-sm font-mono ${
                  hasPostgresError ? 'text-destructive' : 'text-foreground-light'
                }`}
              >
                {hasPostgresError ? `${severity.toUpperCase()} Error` : `${severity.toUpperCase()}`}
              </span>
            )
          : // HTTP status
            data?.status && (
              <span className="text-sm font-mono text-foreground-light">
                {hasError ? `${data.status} Error` : `${data.status} Success`}
              </span>
            )}
      </div>

      {/* Completion message */}
      {isPostgresLog ? (
        // Postgres completion message
        <div className="text-xs text-foreground-light px-2 py-1">
          {hasPostgresError
            ? 'Database operation completed with error'
            : 'Database operation completed successfully'}
        </div>
      ) : (
        // HTTP completion message
        responseTime && (
          <div className="text-xs text-foreground-light px-2 py-1">
            {hasError
              ? `Error response sent to client in ${responseTime}ms`
              : `Response sent to client in ${responseTime}ms`}
          </div>
        )
      )}

      {/* Error/Event details */}
      {isPostgresLog
        ? // Show postgres event message
          eventMessage && (
            <div className="px-2">
              <EventMessage message={eventMessage} severity={severity} />
            </div>
          )
        : // Show HTTP error details
          hasError && (
            <div className="px-2 py-1 mt-1">
              <div className="text-xs font-medium text-destructive mb-1">Error Details</div>
              <div className="text-xs text-foreground-light">
                {status >= 500
                  ? 'Server error occurred during request processing'
                  : status >= 400
                    ? 'Client error - check request parameters and authentication'
                    : 'Request completed with error status'}
              </div>
            </div>
          )}
    </div>
  )
})

MemoizedResponseCompletedBlock.displayName = 'MemoizedResponseCompletedBlock'
