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
    <div className="rounded-lg border bg-surface-75 text-xs text-foreground-lighter p-2 pl-3 flex items-center justify-between gap-3">
      <div className="flex-1">{message}</div>
      <div className="flex items-center gap-2">
        <Button size="tiny" type="outline" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button size="tiny" type="outline" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </div>
  )
}
