import { cn } from 'ui'

/** Lint / status dot (e.g. Advisors in the project sidebar or Navigation V2 toolbar). */
export function ActiveDot({
  hasErrors,
  hasWarnings,
  className,
}: {
  hasErrors: boolean
  hasWarnings: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'absolute pointer-events-none z-10 flex h-2 w-2 rounded-full',
        hasErrors ? 'bg-destructive-600' : hasWarnings ? 'bg-warning-600' : 'bg-transparent',
        className
      )}
    />
  )
}
