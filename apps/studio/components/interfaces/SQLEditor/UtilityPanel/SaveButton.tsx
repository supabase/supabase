import { Loader2 } from 'lucide-react'
import { Button, KeyboardShortcut } from 'ui'

interface SqlSaveButtonProps {
  isDisabled?: boolean
  isSaving?: boolean
  className?: string
  onClick: () => void
}

export const SqlSaveButton = ({
  isDisabled = false,
  isSaving = false,
  className,
  onClick,
}: SqlSaveButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={isDisabled || isSaving}
      type="default"
      size="tiny"
      data-testid="sql-save-button"
      iconRight={
        isSaving ? (
          <Loader2 className="animate-spin" size={10} strokeWidth={1.5} />
        ) : (
          <KeyboardShortcut keys={['Meta', 'S']} variant="inline" />
        )
      }
      className={className}
    >
      Save
    </Button>
  )
}
