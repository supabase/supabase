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
}

export const DiscardChangesConfirmationDialog = ({
  visible,
  onClose,
  onCancel,
  title = 'Unsaved changes',
  description = 'You have unsaved changes. Are you sure you want to discard them?',
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
      <AlertDialogContent size="tiny">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description !== undefined && description !== null && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={handleConfirm}>
            Discard changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
