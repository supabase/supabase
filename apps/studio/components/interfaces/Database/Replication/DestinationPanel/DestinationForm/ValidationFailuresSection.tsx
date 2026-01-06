import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react'
import type { ValidationFailure } from 'data/replication/validate-destination-mutation'
import { cn } from 'ui'

interface ValidationFailuresSectionProps {
  isValidating: boolean
  destinationFailures: ValidationFailure[]
  pipelineFailures: ValidationFailure[]
}

export const ValidationFailuresSection = ({
  isValidating,
  destinationFailures,
  pipelineFailures,
}: ValidationFailuresSectionProps) => {
  const allFailures = [...destinationFailures, ...pipelineFailures]

  const criticalFailures = allFailures.filter((f) => f.failure_type === 'critical')
  const warnings = allFailures.filter((f) => f.failure_type === 'warning')

  const hasCriticalFailures = criticalFailures.length > 0
  const hasWarnings = warnings.length > 0

  if (isValidating) {
    return (
      <div className="rounded-md border border-border bg-surface-100 p-4">
        <div className="flex items-center gap-3 text-foreground-light">
          <Loader2 size={18} className="animate-spin" />
          <div className="space-y-1">
            <span className="text-sm font-medium">Validating configuration...</span>
            <p className="text-xs text-foreground-lighter">
              Checking destination connectivity and pipeline prerequisites
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!hasCriticalFailures && !hasWarnings) {
    return null
  }

  return (
    <div className="space-y-3">
      {hasCriticalFailures && (
        <div className="rounded-md border border-destructive bg-destructive/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle size={18} />
            <h3 className="text-sm font-medium">Configuration Issues</h3>
          </div>
          <p className="text-xs text-foreground-light">
            Please fix the following issues and click "Validate again" to re-check:
          </p>
          <div className="space-y-2">
            {criticalFailures.map((failure, index) => (
              <div
                key={`critical-${index}`}
                className="rounded border border-destructive/20 bg-background p-3 space-y-1"
              >
                <div className="text-xs font-medium text-foreground">{failure.name}</div>
                <div className="text-xs text-foreground-light leading-relaxed whitespace-pre-wrap">
                  {failure.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasWarnings && (
        <div className="rounded-md border border-warning bg-warning/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle size={18} />
            <h3 className="text-sm font-medium">Configuration Warnings</h3>
          </div>
          <p className="text-xs text-foreground-light">
            {hasCriticalFailures
              ? 'Additionally, review these warnings once the critical issues are resolved:'
              : 'Review the following warnings. You can proceed, but consider addressing these:'}
          </p>
          <div className="space-y-2">
            {warnings.map((failure, index) => (
              <div
                key={`warning-${index}`}
                className="rounded border border-warning/20 bg-background p-3 space-y-1"
              >
                <div className="text-xs font-medium text-foreground">{failure.name}</div>
                <div className="text-xs text-foreground-light leading-relaxed">
                  {failure.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
