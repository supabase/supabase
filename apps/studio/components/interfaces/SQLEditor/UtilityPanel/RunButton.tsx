import { Loader2 } from 'lucide-react'
import { KeyboardShortcut } from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface SqlRunButtonProps {
  isDisabled?: boolean
  isExecuting?: boolean
  hasSelection?: boolean
  className?: string
  onClick: () => void
  /**
   * Explanation shown in a tooltip while the button is disabled — e.g. why a
   * logs query can't run on this project. A disabled `<button>` swallows pointer
   * events, so the tooltip is rendered via `ButtonTooltip` (pointer-events-auto)
   * to stay reachable.
   */
  disabledReason?: string
}

export const SqlRunButton = ({
  isDisabled = false,
  isExecuting = false,
  hasSelection = false,
  className,
  onClick,
  disabledReason,
}: SqlRunButtonProps) => {
  return (
    <ButtonTooltip
      onClick={onClick}
      disabled={isDisabled}
      variant="primary"
      size="tiny"
      data-testid="sql-run-button"
      iconRight={
        isExecuting ? (
          <Loader2 className="animate-spin" size={10} strokeWidth={1.5} />
        ) : (
          <KeyboardShortcut keys={['Meta', 'Enter']} variant="inline" />
        )
      }
      className={className}
      tooltip={{ content: { side: 'bottom', text: isDisabled ? disabledReason : undefined } }}
    >
      {hasSelection ? 'Run selected' : 'Run'}
    </ButtonTooltip>
  )
}
