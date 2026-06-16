import { CircleHelpIcon, Undo2 } from 'lucide-react'
import { Button, cn } from 'ui'

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
  const stripClassName = cn(
    'flex items-center justify-between gap-3 border-b border-border px-4 py-3',
    className
  )

  if (variant === 'utility') {
    return (
      <div className={stripClassName}>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-xs font-medium text-foreground">Go back to old logs</p>
          <p className="truncate text-xs text-foreground-light">Use the traditional interface</p>
        </div>
        <ButtonTooltip
          type="default"
          className="shrink-0 px-1.5"
          icon={<Undo2 />}
          onClick={onSwitchBack}
          tooltip={{ content: { side: 'bottom', text: 'Switch back' } }}
        />
      </div>
    )
  }

  return (
    <div role="status" className={stripClassName}>
      <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
        Try Unified Logs
      </p>
      <div className="flex shrink-0 items-center gap-x-2">
        <Button size="tiny" type="default" onClick={onEnable}>
          Enable
        </Button>
        <ButtonTooltip
          type="default"
          className="px-1.5"
          icon={<CircleHelpIcon />}
          onClick={onMoreInfo}
          tooltip={{ content: { side: 'bottom', text: 'More information' } }}
        />
      </div>
    </div>
  )
}
