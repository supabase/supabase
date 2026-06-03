import { PropsWithChildren } from 'react'
import { Button, cn } from 'ui'

interface ConfirmFooterProps {
  message: string
  cancelLabel?: string
  confirmLabel?: string
  confirmLabelLoading?: string
  isLoading?: boolean
  /** Attached inside a card (default) or overhanging below the card bottom edge. */
  placement?: 'attached' | 'overhang'
  onCancel?: () => void | Promise<void>
  onConfirm?: () => void | Promise<void>
}

export const ConfirmFooter = ({
  message,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  confirmLabelLoading = 'Working...',
  isLoading = false,
  placement = 'attached',
  onCancel,
  onConfirm,
}: PropsWithChildren<ConfirmFooterProps>) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-2 pr-2 pl-4 text-xs text-foreground',
        'relative border overflow-hidden gap-3',
        'bg-linear-to-r from-background-surface-75 to-background-surface-200',
        placement === 'attached' && 'border-t-0 rounded-b-lg bg-border shadow-inset',
        placement === 'overhang' && 'rounded-lg shadow-sm'
      )}
    >
      <div className="flex-1 relative z-10">{message}</div>
      <div className="flex items-center gap-2 relative z-10">
        <Button size="tiny" type="outline" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button size="tiny" type="primary" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? confirmLabelLoading : confirmLabel}
        </Button>
      </div>
    </div>
  )
}
