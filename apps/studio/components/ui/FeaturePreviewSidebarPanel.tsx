import { ReactNode } from 'react'
import { cn } from 'ui'

interface FeaturePreviewSidebarPanelProps {
  title: string
  description: string
  illustration?: ReactNode
  actions?: ReactNode
  className?: string
  /** Renders a denser version of the panel with reduced padding and spacing. */
  compact?: boolean
}

export function FeaturePreviewSidebarPanel({
  title,
  description,
  illustration,
  actions,
  className,
  compact = false,
}: FeaturePreviewSidebarPanelProps) {
  return (
    <div
      className={cn(
        'rounded-lg border',
        compact ? 'p-3 space-y-2' : 'p-4 space-y-3',
        'bg-muted/10 border-border/50',
        // Force left alignment and override any centering
        'text-left **:text-left [&_div]:items-start',
        className
      )}
    >
      {illustration && <div className="flex justify-start items-start">{illustration}</div>}

      <div className={cn(compact ? 'space-y-0.5' : 'space-y-1')}>
        <h3 className={cn('font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>
          {title}
        </h3>
        <p className="text-xs text-foreground-light">{description}</p>
      </div>

      {actions && <div className="flex justify-start items-start gap-x-2">{actions}</div>}
    </div>
  )
}
