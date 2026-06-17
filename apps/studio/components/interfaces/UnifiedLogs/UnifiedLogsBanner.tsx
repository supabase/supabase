import { CircleHelpIcon, Undo2 } from 'lucide-react'
import { Badge, Button, cn } from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface UnifiedLogsBannerProps {
  variant: 'promo' | 'utility'
  onEnable?: () => void
  onMoreInfo?: () => void
  onSwitchBack?: () => void
  className?: string
}

export function UnifiedLogsBanner({
  variant,
  onEnable,
  onMoreInfo,
  onSwitchBack,
  className,
}: UnifiedLogsBannerProps) {
  const cardClassName = cn(
    'rounded-lg border p-4 space-y-3 text-left',
    'bg-muted/10 border-border/50',
    className
  )

  if (variant === 'utility') {
    return (
      <div className={cn('rounded-lg border px-4 py-3', 'bg-muted/10 border-border/50', className)}>
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            Go back to old logs
          </p>
          <ButtonTooltip
            variant="default"
            className="shrink-0 px-1.5"
            icon={<Undo2 />}
            onClick={onSwitchBack}
            tooltip={{ content: { side: 'bottom', text: 'Switch back' } }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cardClassName}>
      <div className="flex justify-start">
        <Badge variant="success">New</Badge>
      </div>
      <h3 className="font-medium text-sm text-foreground">Introducing unified logs</h3>
      <div className="flex justify-start items-start gap-x-2">
        <Button variant="default" onClick={onEnable}>
          Enable preview
        </Button>
        <ButtonTooltip
          variant="default"
          className="px-1.5"
          icon={<CircleHelpIcon />}
          onClick={onMoreInfo}
          tooltip={{ content: { side: 'bottom', text: 'More information' } }}
        />
      </div>
    </div>
  )
}
