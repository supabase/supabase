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
    <div className="rounded-b-lg border border-t-0 text-xs text-foreground p-2 pl-4 flex items-center justify-between gap-3  bg-gradient-to-r from-background-surface-75 to-background-muted shadow-inset">
      <div className="flex-1">{message}</div>
      <div className="flex items-center gap-2">
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
