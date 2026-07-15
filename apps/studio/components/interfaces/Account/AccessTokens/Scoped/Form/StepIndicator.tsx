import { cn } from 'ui'

interface StepIndicatorProps {
  /** 1-indexed current step. */
  step: number
  total: number
  label: string
}

export const StepIndicator = ({ step, total, label }: StepIndicatorProps) => (
  <div className="flex items-center gap-2 text-xs text-foreground-light">
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-colors',
            index < step ? 'bg-foreground' : 'bg-border-stronger'
          )}
        />
      ))}
    </div>
    <span>
      <span className="text-foreground">
        Step {step} of {total}
      </span>{' '}
      · {label}
    </span>
  </div>
)
