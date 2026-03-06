'use client'

import { forwardRef, MouseEventHandler, useEffect, useState } from 'react'
import {
  Alert_Shadcn_,
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'
import { DialogDescription, DialogHeader } from 'ui/src/components/shadcn/ui/dialog'

import { Admonition } from './../admonition'

export interface ConfirmationModalProps {
  loading?: boolean
  visible: boolean
  title: string | React.ReactNode
  description?: string | React.ReactNode
  size?: React.ComponentProps<typeof DialogContent>['size']
  confirmLabel?: string
  confirmLabelLoading?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  disabled?: boolean
  variant?: React.ComponentProps<typeof Alert_Shadcn_>['variant']
  alert?: {
    base?: React.ComponentProps<typeof Alert_Shadcn_>
    title?: string
    description?: string | React.ReactNode
  }
  className?: string
}

export const ConfirmationModal = forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof Dialog> & ConfirmationModalProps
>(
  (
    {
      title,
      description,
      size = 'small',
      visible,
      onCancel,
      onConfirm,
      loading: loading_,
      cancelLabel = 'Cancel',
      confirmLabel = 'Submit',
      confirmLabelLoading,
      alert = undefined,
      children,
      variant = 'default',
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    // [Joshen] If `loading_` is provided, let loading state be entirely controlled by the param
    // Otherwise, if the action onConfirm errors out, the UI is stuck in a loading state
    const [loading, setLoading] = useState(loading_ !== undefined ? loading_ : false)

    const onSubmit: MouseEventHandler<HTMLButtonElement> = (e) => {
      e.preventDefault()
      e.stopPropagation()
      onConfirm()
      if (loading_ === undefined) setLoading(true)
    }

    useEffect(() => {
      if (visible && loading_ === undefined) {
        setLoading(false)
      }
    }, [visible])

    useEffect(() => {
      if (loading_ !== undefined) setLoading(loading_)
    }, [loading_])

    return (
      <Dialog
        open={visible}
        {...props}
        onOpenChange={() => {
          if (visible) {
            onCancel()
          }
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          ref={ref}
          className="p-0 gap-0 pb-5 !block"
          size={size}
        >
          <DialogHeader className={cn('border-b')} padding={'small'}>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {alert && (
            <Admonition
              type={variant as 'default' | 'destructive' | 'warning'}
              label={alert.title}
              description={alert.description}
              className="border-x-0 rounded-none -mt-px"
              {...alert?.base}
            />
          )}
          {children && (
            <>
              <DialogSection padding="small" className={className}>
                {children}
              </DialogSection>
              <DialogSectionSeparator />
            </>
          )}
          <div className="flex gap-2 px-5 pt-5">
            <Button
              size="medium"
              block
              type="default"
              disabled={loading}
              onClick={() => onCancel()}
            >
              {cancelLabel}
            </Button>

            <Button
              block
              size="medium"
              type={
                variant === 'destructive' ? 'danger' : variant === 'warning' ? 'warning' : 'primary'
              }
              htmlType="submit"
              loading={loading}
              disabled={loading || disabled}
              onClick={onSubmit}
              className="truncate"
            >
              {loading && confirmLabelLoading ? confirmLabelLoading : confirmLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
)

ConfirmationModal.displayName = 'ConfirmationModal'

export default ConfirmationModal
