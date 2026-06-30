import { CirclePlay, Loader2 } from 'lucide-react'
import { Button } from 'ui'

import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

interface SqlRunButtonProps {
  isDisabled?: boolean
  isExecuting?: boolean
  hasSelection?: boolean
  className?: string
  onClick: () => void
}

export const SqlRunButton = ({
  isDisabled = false,
  isExecuting = false,
  hasSelection = false,
  className,
  onClick,
}: SqlRunButtonProps) => {
  return (
    <ShortcutTooltip
      shortcutId={SHORTCUT_IDS.SQL_EDITOR_RUN}
      label={hasSelection ? 'Run selected' : undefined}
    >
      <Button
        onClick={onClick}
        disabled={isDisabled}
        variant="primary"
        size="tiny"
        data-testid="sql-run-button"
        icon={
          isExecuting ? (
            <Loader2 className="animate-spin" size={10} strokeWidth={1.5} />
          ) : (
            <CirclePlay size={12} strokeWidth={1.5} />
          )
        }
        className={className}
      >
        {hasSelection ? 'Run selected' : 'Run'}
      </Button>
    </ShortcutTooltip>
  )
}
