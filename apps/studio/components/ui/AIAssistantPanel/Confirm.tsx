import { type PropsWithChildren } from 'react'
import { Button, cn } from 'ui'

import { getConfirmFooterBar } from './Confirm.utils'

interface ConfirmFooterProps {
  message: string
  cancelLabel?: string
  confirmLabel?: string
  confirmLabelLoading?: string
  isLoading?: boolean
  isDisabled?: boolean
  onCancel?: () => void | Promise<void>
  onConfirm?: () => void | Promise<void>
}

/** Action bar that sits at the bottom of `Confirm`. */
export const ConfirmFooter = ({
  message,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  confirmLabelLoading = 'Working...',
  isLoading = false,
  isDisabled = false,
  onCancel,
  onConfirm,
}: ConfirmFooterProps) => {
  const isInactive = isLoading || isDisabled

  return (
    <div
      className={cn(
        'flex items-center justify-between py-2 pr-2 pl-4 text-xs text-foreground gap-3 shrink-0',
        'relative overflow-hidden border-t bg-border shadow-inset',
        'bg-linear-to-r from-background-surface-75 to-background-surface-200'
      )}
    >
      <div className="flex-1 relative z-10">{message}</div>
      <div className="flex items-center gap-2 relative z-10">
        <Button size="tiny" variant="outline" onClick={onCancel} disabled={isInactive}>
          {cancelLabel}
        </Button>
        <Button size="tiny" variant="primary" onClick={onConfirm} disabled={isInactive}>
          {isLoading ? confirmLabelLoading : confirmLabel}
        </Button>
      </div>
    </div>
  )
}

interface ConfirmProps {
  /**
   * Result of `getManualToolApprovalConfirmState`. Interactive buttons only for
   * `approval-requested`; `approval-responded` is the post-approve loading morph.
   */
  state?: string
  message: string
  cancelLabel?: string
  confirmLabel?: string
  confirmLabelLoading?: string
  extraLoading?: boolean
  isLoading?: boolean
  /**
   * Children fill the remaining height of the card (e.g. `QueryEditor` in viewport
   * mode). Omit for content-sized bodies like notebook previews.
   */
  fill?: boolean
  className?: string
  onCancel?: () => void | Promise<void>
  onConfirm?: () => void | Promise<void>
}

/**
 * Card that wraps an assistant tool preview and optionally attaches a confirm footer
 * below it. The card owns the frame; nested surfaces (QueryEditor viewport, unframed
 * edge-function blocks) fill the body.
 */
export const Confirm = ({
  children,
  state,
  message,
  cancelLabel = 'Skip',
  confirmLabel = 'Confirm',
  confirmLabelLoading = 'Working...',
  extraLoading = false,
  isLoading = false,
  fill = false,
  className,
  onCancel,
  onConfirm,
}: PropsWithChildren<ConfirmProps>) => {
  const bar = getConfirmFooterBar(state)
  const showLoading = bar.isLoading || extraLoading || isLoading
  const isApprovalRequested = state === 'approval-requested'

  return (
    <div
      data-slot="assistant-confirm"
      className={cn(
        'flex flex-col overflow-hidden rounded-md border shadow-xs bg-muted',
        fill && 'min-h-64',
        className
      )}
    >
      <div className={cn('min-w-0', fill && 'flex min-h-0 flex-1 flex-col overflow-hidden')}>
        {children}
      </div>
      {bar.show && (
        <ConfirmFooter
          message={message}
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          confirmLabelLoading={confirmLabelLoading}
          isLoading={showLoading}
          isDisabled={!isApprovalRequested}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )}
    </div>
  )
}
