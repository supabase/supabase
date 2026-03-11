'use client'

import * as Dialog from '@radix-ui/react-dialog'
import React from 'react'

import { Button } from '../../components/Button/Button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/shadcn/ui/tooltip'
import styleHandler from '../../lib/theme/styleHandler'

export type SidePanelProps = RadixProps & CustomProps

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

interface CustomProps {
  id?: String | undefined
  disabled?: boolean
  className?: String
  children?: React.ReactNode
  header?: string | React.ReactNode
  visible: boolean
  size?: 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge' | 'xxxxlarge'
  loading?: boolean
  align?: 'right' | 'left'
  hideFooter?: boolean
  customFooter?: React.ReactNode
  onCancel?: () => void
  cancelText?: String
  onConfirm?: () => void
  confirmText?: String
  triggerElement?: React.ReactNode
  tooltip?: string
}

const SidePanel = ({
  id,
  disabled,
  className,
  children,
  header,
  visible,
  open,
  size = 'medium',
  loading,
  align = 'right',
  hideFooter = false,
  customFooter = undefined,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  triggerElement,
  defaultOpen,
  tooltip,
  ...props
}: SidePanelProps) => {
  const __styles = styleHandler('sidepanel')

  const footerContent = customFooter ? (
    customFooter
  ) : (
    <div className={__styles.footer}>
      <div>
        <Button disabled={loading} type="default" onClick={() => (onCancel ? onCancel() : null)}>
          {cancelText}
        </Button>
      </div>
      {!!onConfirm && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button
                htmlType="submit"
                disabled={disabled || loading}
                loading={loading}
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
            </span>
          </TooltipTrigger>
          {tooltip !== undefined && <TooltipContent side="bottom">{tooltip}</TooltipContent>}
        </Tooltip>
      )}
    </div>
  )

  function handleOpenChange(open: boolean) {
    if (visible !== undefined && !open) {
      // controlled component behaviour
      if (onCancel) onCancel()
    } else {
      // un-controlled component behaviour
      // setOpen(open)
    }
  }

  open = open || visible

  const {
    onOpenAutoFocus,
    onCloseAutoFocus,
    onEscapeKeyDown,
    onPointerDownOutside,
    onInteractOutside,
  } = props

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange} defaultOpen={defaultOpen}>
      {triggerElement && <Dialog.Trigger asChild>{triggerElement}</Dialog.Trigger>}

      <Dialog.Portal>
        <Dialog.Overlay className={__styles.overlay} />
        <Dialog.Content
          className={[
            __styles.base,
            __styles.size[size],
            __styles.align[align],
            className && className,
          ].join(' ')}
          onOpenAutoFocus={onOpenAutoFocus}
          onCloseAutoFocus={onCloseAutoFocus}
          onEscapeKeyDown={onEscapeKeyDown}
          onPointerDownOutside={onPointerDownOutside}
          onInteractOutside={(event) => {
            const isToast = (event.target as Element)?.closest('#toast')
            if (isToast) event.preventDefault()
            if (onInteractOutside) onInteractOutside(event)
          }}
          {...props}
        >
          {header && <header className={__styles.header}>{header}</header>}
          <div className={__styles.contents}>{children}</div>
          {!hideFooter && footerContent}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function Separator() {
  let __styles = styleHandler('sidepanel')

  return <div className={__styles.separator}></div>
}

export function Content({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  let __styles = styleHandler('sidepanel')

  return <div className={[__styles.content, className].join(' ').trim()}>{children}</div>
}

SidePanel.Content = Content
SidePanel.Separator = Separator
export default SidePanel
