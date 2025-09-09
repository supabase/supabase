import { PropsWithChildren } from 'react'

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
    <div className="rounded-lg border bg-surface-75 font-mono text-xs text-foreground-lighter py-2 px-3 flex items-center justify-between gap-3">
      <div className="flex-1">{message}</div>
      <div className="flex items-center gap-2">
        <button
          className="text-xs px-2 py-1 border rounded hover:bg-surface-100"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelLabel}
        </button>
        <button
          className="text-xs px-2 py-1 border rounded hover:bg-surface-100"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Working…' : confirmLabel}
        </button>
      </div>
    </div>
  )
}
