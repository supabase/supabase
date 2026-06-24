import { Check, Loader2 } from 'lucide-react'
import { cn } from 'ui'

interface WarehouseProgressStepsProps {
  steps: string[]
  /**
   * Index of the step currently in progress. Steps before it are complete,
   * steps after it are pending. Pass `steps.length` to mark everything done.
   */
  activeIndex: number
}

/**
 * Vertical checklist that surfaces every step of a long-running operation:
 * a check on completed steps, a spinner on the active one, and a quiet dot on
 * what's still to come. More discoverable than a single anonymous spinner.
 */
export function WarehouseProgressSteps({ steps, activeIndex }: WarehouseProgressStepsProps) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col overflow-hidden rounded-lg border bg-surface-75">
        {steps.map((label, index) => {
          const status = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending'

          return (
            <li
              key={label}
              className={cn(
                'flex items-center gap-3 px-3.5 py-3 text-sm transition-colors duration-300',
                index > 0 && 'border-t',
                status === 'active' && 'bg-surface-100'
              )}
            >
              <span className="flex size-5 shrink-0 items-center justify-center">
                {status === 'done' && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-brand/10">
                    <Check size={12} strokeWidth={2.5} className="text-brand" />
                  </span>
                )}
                {status === 'active' && (
                  <Loader2
                    size={16}
                    strokeWidth={2}
                    className="animate-spin text-foreground-light"
                  />
                )}
                {status === 'pending' && (
                  <span className="size-1.5 rounded-full bg-foreground-muted/40" />
                )}
              </span>
              <span
                className={cn(
                  'transition-colors duration-300',
                  status === 'done' && 'text-foreground-light',
                  status === 'active' && 'font-medium text-foreground',
                  status === 'pending' && 'text-foreground-muted'
                )}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
