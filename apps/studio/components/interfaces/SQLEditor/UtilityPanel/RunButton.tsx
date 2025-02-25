import { detectOS } from 'lib/helpers'
import { Command, CornerDownLeft, Loader2 } from 'lucide-react'
import { Button } from 'ui'

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
  const os = detectOS()

  function handleOnClick() {
    onClick()
  }

  return (
    <Button
      onClick={handleOnClick}
      disabled={isDisabled}
      type="primary"
      size="tiny"
      iconRight={
        isExecuting ? (
          <Loader2 className="animate-spin" size={10} strokeWidth={1.5} />
        ) : (
          <div className="flex items-center space-x-1">
            {os === 'macos' ? (
              <Command size={10} strokeWidth={1.5} />
            ) : (
              <p className="text-xs text-foreground-light">CTRL</p>
            )}
            <CornerDownLeft size={10} strokeWidth={1.5} />
          </div>
        )
      }
      className={className}
    >
      {hasSelection ? 'Run selected' : 'Run'}
    </Button>
  )
}
