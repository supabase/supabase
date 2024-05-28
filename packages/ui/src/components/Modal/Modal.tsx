'use client'

import React, { forwardRef, useEffect } from 'react'
import styleHandler from '../../lib/theme/styleHandler'
import { cn } from '../../lib/utils/cn'
import { Button, ButtonVariantProps } from '../Button/Button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '../shadcn/ui/dialog'

export interface ModalProps extends React.ComponentProps<typeof DialogContent> {
  Separator?: React.ComponentType
  Content?: React.ComponentType
  visible?: boolean
  customFooter?: React.ReactNode
  description?: string
  hideFooter?: boolean
  alignFooter?: 'right' | 'left'
  layout?: 'horizontal' | 'vertical'
  loading?: boolean
  onCancel?: any
  cancelText?: string
  onConfirm?: any
  confirmText?: string
  showCloseButton?: boolean
  footerBackground?: boolean
  variant?: ButtonVariantProps['type']
  overlayStyle?: React.CSSProperties
  contentStyle?: React.CSSProperties
  overlayClassName?: string
  triggerElement?: React.ReactNode
  header?: React.ReactNode
  modal?: React.ComponentProps<typeof Dialog>['modal']
  defaultOpen?: React.ComponentProps<typeof Dialog>['defaultOpen']
  /**
   * @deprecated No longer in use
   */
  closable?: boolean
}

interface ModalType
  extends React.ForwardRefExoticComponent<
    React.ComponentPropsWithoutRef<typeof DialogContent> & ModalProps
  > {
  Content: React.ComponentType<{ children: React.ReactNode; className?: string }>
  Separator: React.ComponentType
}

const Modal = forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent> & ModalProps
>(
  (
    {
      children,
      customFooter = undefined,
      description,
      hideFooter = false,
      alignFooter = 'left',
      layout = 'horizontal',
      loading = false,
      cancelText = 'Cancel',
      onConfirm = () => {},
      onCancel = () => {},
      confirmText = 'Confirm',
      showCloseButton = false,
      footerBackground,
      variant = 'success',
      visible = false,
      size = 'large',
      style,
      overlayStyle,
      contentStyle,
      className = '',
      overlayClassName,
      triggerElement,
      header,
      modal,
      defaultOpen,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(visible ? visible : false)
    const __styles = styleHandler('modal')

    useEffect(() => {
      setOpen(visible)
    }, [visible])

    const footerContent = customFooter ? (
      customFooter
    ) : (
      <div
        className="flex w-full space-x-2"
        style={{
          width: '100%',
          justifyContent:
            layout === 'vertical' ? 'center' : alignFooter === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        <Button type="default" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          loading={loading}
          type={variant === 'danger' ? 'danger' : 'primary'}
        >
          {confirmText}
        </Button>
      </div>
    )

    function handleOpenChange(open: boolean) {
      if (visible !== undefined && !open) {
        // controlled component behaviour
        onCancel()
      } else {
        // un-controlled component behaviour
        setOpen(open)
      }
    }

    return (
      <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={handleOpenChange} modal={modal}>
        {triggerElement && <DialogTrigger>{triggerElement}</DialogTrigger>}
        <DialogContent ref={ref} hideClose={!showCloseButton} {...props}>
          <DialogHeader className={cn('border-b')}>
            {header && <DialogTitle>{header}</DialogTitle>}
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
          {!hideFooter && <DialogFooter className={__styles.footer}>{footerContent}</DialogFooter>}
        </DialogContent>
      </Dialog>
    )
  }
) as ModalType

const Content = forwardRef<
  React.ElementRef<typeof DialogSection>,
  React.ComponentPropsWithoutRef<typeof DialogSection>
>(({ ...props }, ref) => {
  return <DialogSection ref={ref} {...props} />
})

const Separator = forwardRef<
  React.ElementRef<typeof DialogSectionSeparator>,
  React.ComponentPropsWithoutRef<typeof DialogSectionSeparator>
>(({ ...props }, ref) => {
  return <DialogSectionSeparator ref={ref} {...props} />
})

Modal.Content = Content
Modal.Separator = Separator
export default Modal
