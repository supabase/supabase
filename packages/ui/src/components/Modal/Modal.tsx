'use client'

import React, { forwardRef, useEffect } from 'react'

import styleHandler from '../../lib/theme/styleHandler'
import { cn } from '../../lib/utils/cn'
import { Button, ButtonVariantProps } from '../Button/Button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from '../shadcn/ui/dialog'

export interface ModalProps extends React.ComponentProps<typeof DialogContent> {
  Separator?: React.ComponentType
  Content?: React.ComponentType
  visible?: boolean
  /** @deprecated please add the footer directly in component children. This is to prepare for using <DialogFooter/> component */
  customFooter?: React.ReactNode
  description?: string
  /** @deprecated please add the footer directly in component children. This is to prepare for using <DialogFooter/> component */
  hideFooter?: boolean
  /** @deprecated please add the footer directly in component children. This is to prepare for using <DialogFooter/> component */
  alignFooter?: 'right' | 'left'
  /** @deprecated please add the footer directly in component children. This is to prepare for using <DialogFooter/> component */
  layout?: 'horizontal' | 'vertical'
  loading?: boolean
  onCancel?: any
  cancelText?: string
  onConfirm?: any
  confirmText?: string
  showCloseButton?: boolean
  footerBackground?: boolean
  /** @deprecated please add the footer directly in component children. This is to prepare for using <DialogFooter/> component */
  variant?: ButtonVariantProps['type']
  overlayStyle?: React.CSSProperties
  contentStyle?: React.CSSProperties
  dialogOverlayProps?: React.ComponentProps<typeof DialogContent>['dialogOverlayProps']
  /** @deprecated please consider using <Dialog/> and <DialogTrigger/> components */
  triggerElement?: React.ReactNode
  /** @deprecated please consider using <Dialog/> and <DialogHeader/> components */
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

/** @deprecated Use `import { Dialog } from "ui"` instead */
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
      showCloseButton = true,
      footerBackground,
      variant = 'success',
      visible = false,
      size = 'large',
      style,
      overlayStyle,
      contentStyle,
      triggerElement,
      header,
      modal,
      defaultOpen,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(visible ? visible : false)

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
          type={variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary'}
        >
          {confirmText}
        </Button>
      </div>
    )

    function handleOpenChange(open: boolean) {
      if (visible !== undefined && !open) {
        // controlled component behavior
        onCancel()
      } else {
        // un-controlled component behavior
        setOpen(open)
      }
    }

    return (
      <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={handleOpenChange} modal={modal}>
        {triggerElement && <DialogTrigger>{triggerElement}</DialogTrigger>}
        <DialogContent ref={ref} hideClose={!showCloseButton} {...props} size={size}>
          {header || description ? (
            <DialogHeader className={cn('border-b')} padding={'small'}>
              {header && <DialogTitle>{header}</DialogTitle>}
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
          ) : null}
          {children}
          {!hideFooter && <DialogFooter padding={'small'}>{footerContent}</DialogFooter>}
        </DialogContent>
      </Dialog>
    )
  }
) as ModalType

const Content = forwardRef<
  React.ElementRef<typeof DialogSection>,
  React.ComponentPropsWithoutRef<typeof DialogSection>
>(({ ...props }, ref) => {
  return <DialogSection ref={ref} {...props} padding="small" className={cn(props.className)} />
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
