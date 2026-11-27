import { ReactNode } from 'react'
import { cn } from 'ui'

interface AddonRowProps {
  icon: ReactNode
  title: string
  description: string
  /** Muted text after the description, usually a docs link */
  descriptionAction?: ReactNode
  isEnabled: boolean
  /** Short state shown on the right, e.g. "Disabled", "Small", "2 active". Hidden while loading */
  status?: string
  /** Secondary line under the status, e.g. a price */
  detail?: string
  action: ReactNode
}

export const AddonRow = ({
  icon,
  title,
  description,
  descriptionAction,
  isEnabled,
  status,
  detail,
  action,
}: AddonRowProps) => {
  return (
    <div className="flex items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0">
      <div
        aria-hidden="true"
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg border',
          isEnabled
            ? 'border-brand-400 bg-brand-200 text-brand-600'
            : 'bg-surface-100 text-foreground-light'
        )}
      >
        {icon}
      </div>
      <div className="flex-1 space-y-0.5">
        <div className="text-foreground">{title}</div>
        <p className="m-0 text-foreground-light">
          {description} {descriptionAction}
        </p>
      </div>
      <div className="text-right">
        <div className={cn(isEnabled ? 'text-foreground' : 'text-foreground-lighter')}>
          {status}
        </div>
        {detail && <div className="text-xs text-foreground-lighter">{detail}</div>}
      </div>
      <div className="flex min-w-[60px] justify-end">{action}</div>
    </div>
  )
}

interface AddonGroupProps {
  label: string
  children: ReactNode
}

export const AddonGroup = ({ label, children }: AddonGroupProps) => (
  <section className="mt-6 first:mt-0">
    <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-foreground-lighter">
      {label}
    </h3>
    {children}
  </section>
)
