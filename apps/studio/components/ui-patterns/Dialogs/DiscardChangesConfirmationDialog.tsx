'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'

import { type ConfirmOnCloseModalProps } from 'hooks/ui/useConfirmOnClose'
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

interface DiscardChangesConfirmationDialogProps extends ConfirmOnCloseModalProps {
  title?: ReactNode
  description?: ReactNode
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
}

export const DiscardChangesConfirmationDialog = ({
  visible,
  onClose,
  onCancel,
  title = 'Discard changes?',
  description = 'Are you sure you want to discard your changes? Any unsaved changes will be lost.',
  confirmLabel = 'Discard changes',
  cancelLabel = 'Keep editing',
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description !== undefined && description !== null && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
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
