import { ReactNode } from 'react'
import { cn } from 'ui'

interface FeaturePreviewSidebarPanelProps {
  title: string
  description: string
  illustration?: ReactNode
  actions?: ReactNode
  className?: string
}

export function FeaturePreviewSidebarPanel({
  title,
  description,
  illustration,
  actions,
  className,
}: FeaturePreviewSidebarPanelProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4 space-y-3',
        'bg border-border/50',
        // Force left alignment and override any centering
        'text-left [&_*]:text-left [&_div]:items-start [&_p]:text-left',
        className
      )}
    >
      {illustration && <div className="flex justify-start items-start">{illustration}</div>}

      <div className="space-y-1 text-left">
        <h3 className="font-medium text-sm text-foreground text-left">{title}</h3>
        <p className="text-xs text-foreground-light text-left">{description}</p>
      </div>

      {actions && <div className="flex justify-start items-start">{actions}</div>}
    </div>
  )
}
