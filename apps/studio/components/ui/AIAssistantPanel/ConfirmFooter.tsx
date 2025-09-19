import { PropsWithChildren } from 'react'
import { Button } from 'ui'

interface ConfirmFooterProps {
  message: string
  cancelLabel?: string
  confirmLabel?: string
  isLoading?: boolean
  onCancel?: () => void | Promise<void>
  onConfirm?: () => void | Promise<void>
}

export const ConfirmFooter = ({
  message,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  isLoading = false,
  onCancel,
  onConfirm,
}: PropsWithChildren<ConfirmFooterProps>) => {
  return (
    <div className="relative border border-t-0 overflow-hidden rounded-b-lg text-xs bg-border shadow-inset flex items-center justify-between gap-3 bg-gradient-to-r from-background-surface-75 to-background-surface-200 text-foreground py-2 pr-2 pl-4">
      <div className="flex-1 relative z-10">{message}</div>
      <div className="flex items-center gap-2 relative z-10">
        <Button size="tiny" type="outline" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button size="tiny" type="primary" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </div>
  )
}
