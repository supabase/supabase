import { PlusIcon } from 'lucide-react'
import { Button } from 'ui'

export function InsertRowButton({
  disabled,
  onClick,
  className,
}: {
  disabled: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <Button
      variant="default"
      size="tiny"
      icon={<PlusIcon size={14} />}
      disabled={disabled}
      onClick={onClick}
      className={className}
    >
      Insert row
    </Button>
  )
}
