'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'

import { type ConfirmOnCloseModalProps } from '@/hooks/ui/useConfirmOnClose'

export interface DiscardChangesConfirmationDialogProps extends ConfirmOnCloseModalProps {
  title?: ReactNode
  description?: ReactNode
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  size?: React.ComponentProps<typeof AlertDialogContent>['size']
  /** Extra content rendered between the description and the footer, e.g. an opt-out checkbox. */
  children?: ReactNode
}

export const DiscardChangesConfirmationDialog = ({
  visible,
  onClose,
  onCancel,
  title = 'Unsaved changes',
  description = 'You have unsaved changes. Are you sure you want to discard them?',
  confirmLabel = 'Discard changes',
  cancelLabel = 'Keep editing',
  size = 'tiny',
  children,
}: DiscardChangesConfirmationDialogProps) => {
  const isConfirmingRef = useRef(false)

  useEffect(() => {
    if (visible) {
      isConfirmingRef.current = false
    }
  }, [visible])

  const handleConfirm = useCallback(() => {
    isConfirmingRef.current = true
    onClose()
  }, [onClose])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) return

      if (isConfirmingRef.current) {
        isConfirmingRef.current = false
        return
      }

      onCancel()
    },
    [onCancel]
  )

  return (
    <AlertDialog open={visible} onOpenChange={handleOpenChange}>
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description !== undefined && description !== null && (
            <AlertDialogDescription asChild>
              <div>
                {description}
                {children && <div className="mt-4">{children}</div>}
              </div>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={handleConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
