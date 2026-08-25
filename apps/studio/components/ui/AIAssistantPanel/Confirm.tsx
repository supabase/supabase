import { Check, X } from 'lucide-react'
import { type PropsWithChildren, type ReactNode } from 'react'
import { Button, cn } from 'ui'

import { getConfirmFooterBar, type ConfirmFooterApprovalState } from './Confirm.utils'

interface ConfirmFooterProps {
  message: string
  cancelLabel?: string
  confirmLabel?: string
  confirmLabelLoading?: string
  isLoading?: boolean
  isDisabled?: boolean
  outcome?: 'success' | 'error' | 'denied'
  showActions?: boolean
  action?: ReactNode
  /** Omit the confirm button so only Skip remains (unparseable / unapplyable previews). */
  denyOnly?: boolean
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
  outcome,
  showActions = true,
  action,
  denyOnly = false,
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
      <div role="status" className="min-w-0 flex flex-1 items-center gap-2">
        {outcome === 'success' && <Check className="size-3.5 shrink-0 text-brand" />}
        {outcome === 'error' && <X className="size-3.5 shrink-0 text-danger" />}
        <span>{message}</span>
      </div>
      {(showActions || action) && (
        <div className="flex shrink-0 items-center gap-2">
          {showActions && (
            <>
              <Button size="tiny" variant="outline" onClick={onCancel} disabled={isInactive}>
                {cancelLabel}
              </Button>
              {!denyOnly && (
                <Button size="tiny" variant="primary" onClick={onConfirm} disabled={isInactive}>
                  {isLoading ? confirmLabelLoading : confirmLabel}
                </Button>
              )}
            </>
          )}
          {action}
        </div>
      )}
    </div>
  )
}

interface ConfirmProps {
  /**
   * Result of `getManualToolApprovalConfirmState`. Interactive buttons only for
   * `approval-requested`; `approval-responded` is the post-approve loading morph.
   */
  state?: ConfirmFooterApprovalState
  message: string
  cancelLabel?: string
  confirmLabel?: string
  confirmLabelLoading?: string
  successMessage?: string
  errorMessage?: string
  deniedMessage?: string
  footerAction?: ReactNode
  extraLoading?: boolean
  isLoading?: boolean
  /**
   * Children fill the remaining height of the card (e.g. `QueryEditor` in viewport
   * mode). Omit for content-sized bodies like notebook previews and Edge Function blocks.
   */
  fill?: boolean
  className?: string
  /** Omit the confirm button so only Skip remains. */
  denyOnly?: boolean
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
  successMessage,
  errorMessage,
  deniedMessage,
  footerAction,
  extraLoading = false,
  isLoading = false,
  fill = false,
  className,
  denyOnly = false,
  onCancel,
  onConfirm,
}: PropsWithChildren<ConfirmProps>) => {
  const bar = getConfirmFooterBar(state)
  const showLoading = bar.isLoading || extraLoading || isLoading
  const isApprovalRequested = state === 'approval-requested'
  const isApprovalResponded = state === 'approval-responded'
  const showActions = isApprovalRequested || isApprovalResponded
  const outcomeMessages = {
    success: successMessage,
    error: errorMessage,
    denied: deniedMessage,
  }
  const footerMessage = bar.outcome ? (outcomeMessages[bar.outcome] ?? message) : message

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
          message={footerMessage}
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          confirmLabelLoading={confirmLabelLoading}
          isLoading={showLoading}
          isDisabled={!isApprovalRequested}
          outcome={bar.outcome}
          showActions={showActions}
          action={footerAction}
          denyOnly={denyOnly}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )}
    </div>
  )
}
