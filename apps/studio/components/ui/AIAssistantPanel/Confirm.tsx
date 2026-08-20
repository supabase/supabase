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
  /** Escape hatch for consumers that attach the bar directly under their own frame. */
  className?: string
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
  className,
  onCancel,
  onConfirm,
}: ConfirmFooterProps) => {
  const isInactive = isLoading || isDisabled

  return (
    <div
      className={cn(
        'mx-3 flex shrink-0 items-center justify-between gap-3 rounded-b-md py-2 pr-2 pl-3',
        'border-x border-b bg-surface-200 text-xs text-foreground-light',
        className
      )}
    >
      <div className="min-w-0 flex-1">{message}</div>
      <div className="flex shrink-0 items-center gap-2">
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
   * mode). Omit for content-sized bodies like notebook previews and Edge Function blocks.
   */
  fill?: boolean
  className?: string
  onCancel?: () => void | Promise<void>
  onConfirm?: () => void | Promise<void>
}

/**
 * Card that wraps an assistant tool preview and optionally attaches a confirm footer
 * below it. The card owns the frame; the footer hangs inset from the sides so it reads
 * as tucked under the card. Nested surfaces (QueryEditor viewport, unframed notebook
 * previews, Edge Function blocks) fill the body.
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
      className={cn('flex flex-col', fill && 'min-h-64', className)}
    >
      <div
        className={cn(
          'min-w-0 overflow-hidden rounded-md border shadow-xs bg-muted',
          fill && 'flex min-h-0 flex-1 flex-col overflow-hidden'
        )}
      >
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
