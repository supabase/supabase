import { PropsWithChildren } from 'react'

import { Button, cn } from 'ui'

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
    <div
      className={cn(
        'flex items-center justify-between py-2 pr-2 pl-4 text-xs text-foreground',
        'relative border border-t-0 overflow-hidden rounded-b-lg bg-border shadow-inset gap-3',
        'bg-gradient-to-r from-background-surface-75 to-background-surface-200'
      )}
    >
      <div className="flex-1 relative z-10">{message}</div>
      <div className="flex items-center gap-2 relative z-10">
        <Button size="tiny" type="outline" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button size="tiny" type="primary" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Working...' : confirmLabel}
        </Button>
      </div>
    </div>
  )
}
