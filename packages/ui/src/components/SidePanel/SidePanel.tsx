'use client'

import * as Dialog from '@radix-ui/react-dialog'
import React from 'react'
import {
  Button,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from '../../../index'
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
      {onConfirm !== undefined && (
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_ asChild>
            <Button
              htmlType="submit"
              disabled={disabled || loading}
              loading={loading}
              onClick={() => (onConfirm ? onConfirm() : null)}
            >
              {confirmText}
            </Button>
          </TooltipTrigger_Shadcn_>
          {tooltip !== undefined && (
            <TooltipContent_Shadcn_ side="bottom">{tooltip}</TooltipContent_Shadcn_>
          )}
        </Tooltip_Shadcn_>
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

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange} defaultOpen={defaultOpen}>
      {triggerElement && (
        <Dialog.Trigger asChild className={__styles.trigger}>
          {triggerElement}
        </Dialog.Trigger>
      )}

      <Dialog.Portal>
        <Dialog.Overlay className={__styles.overlay} />
        <Dialog.Content
          className={[
            __styles.base,
            __styles.size[size],
            __styles.align[align],
            className && className,
          ].join(' ')}
          onOpenAutoFocus={props.onOpenAutoFocus}
          onCloseAutoFocus={props.onCloseAutoFocus}
          onEscapeKeyDown={props.onEscapeKeyDown}
          onPointerDownOutside={props.onPointerDownOutside}
          onInteractOutside={(event) => {
            const isToast = (event.target as Element)?.closest('#toast')
            if (isToast) event.preventDefault()
            if (props.onInteractOutside) props.onInteractOutside(event)
          }}
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
