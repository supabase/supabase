'use client'

import * as Dialog from '@radix-ui/react-dialog'
import React, { useEffect } from 'react'

import styleHandler from '../../lib/theme/styleHandler'
import { cn } from '../../lib/utils/cn'
import { AnimationTailwindClasses } from '../../types'
import { Button } from '../Button/Button'
import IconX from '../Icon/icons/IconX/IconX'
import Space from '../Space/Space'

// import { Transition } from '@tailwindui/react'
// Merge Radix Props to surface in the modal component
export type ModalProps = RadixProps & Props

interface RadixProps
  extends Dialog.DialogProps,
    Pick<
      Dialog.DialogContentProps,
      | 'onOpenAutoFocus'
      | 'onCloseAutoFocus'
      | 'onEscapeKeyDown'
      | 'onPointerDownOutside'
      | 'onInteractOutside'
    > {}

interface Props {
  children?: React.ReactNode
  customFooter?: React.ReactNode
  description?: string
  hideFooter?: boolean
  alignFooter?: 'right' | 'left'
  layout?: 'horizontal' | 'vertical'
  icon?: React.ReactNode
  loading?: boolean
  onCancel?: any
  cancelText?: string
  onConfirm?: any
  confirmText?: string
  /**
   * @deprecated This prop is no longer being used in the Modal component
   */
  closable?: boolean
  showIcon?: boolean
  showCloseButton?: boolean
  footerBackground?: boolean
  title?: string | React.ReactNode
  variant?: 'danger' | 'warning' | 'success'
  visible: boolean
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'
  style?: React.CSSProperties
  overlayStyle?: React.CSSProperties
  contentStyle?: React.CSSProperties
  className?: string
  overlayClassName?: string
  transition?: AnimationTailwindClasses
  transitionOverlay?: AnimationTailwindClasses
  triggerElement?: React.ReactNode
  header?: React.ReactNode
}

const Modal = ({
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
  closable = false,
  showIcon = false,
  showCloseButton = false,
  title,
  footerBackground,
  icon,
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
  ...props
}: ModalProps) => {
  const [open, setOpen] = React.useState(visible ? visible : false)
  const __styles = styleHandler('modal')

  useEffect(() => {
    setOpen(visible)
  }, [visible])

  const footerContent = customFooter ? (
    customFooter
  ) : (
    <Space
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
    </Space>
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
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      {triggerElement && <Dialog.Trigger>{triggerElement}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className={__styles.overlay} />
        <Dialog.Overlay className={__styles.scroll_overlay}>
          <Dialog.Content
            className={[__styles.base, __styles.size[size], className].join(' ')}
            onInteractOutside={props.onInteractOutside}
            onEscapeKeyDown={props.onEscapeKeyDown}
          >
            {header && (
              <div className={__styles.header}>
                {header}
                {showCloseButton && (
                  <Button
                    onClick={onCancel}
                    type="text"
                    icon={<IconX size="small" strokeWidth={1.5} />}
                    className="p-0.5 !mt-0"
                  />
                )}
              </div>
            )}
            {children}
            {!hideFooter && <div className={__styles.footer}>{footerContent}</div>}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Content({ children, className }: { children: React.ReactNode; className?: string }) {
  const __styles = styleHandler('modal')
  return <div className={cn(__styles.content, className)}>{children}</div>
}

export function Separator() {
  const __styles = styleHandler('modal')

  return <div className={__styles.separator}></div>
}

Modal.Content = Content
Modal.Separator = Separator
export default Modal
