'use client'

import { cva } from 'class-variance-authority'
import { Dialog } from 'radix-ui'
import React from 'react'

import { Button } from '../../components/Button/Button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/shadcn/ui/tooltip'
import { cn } from '../../lib/utils'

export type SidePanelProps = RadixProps & CustomProps

interface RadixProps
  extends
    Dialog.DialogProps,
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

export const sidePanelContentVariants = cva(
  cn('z-50 bg-dash-sidebar flex flex-col fixed inset-y-0 h-full lg:h-screen border-l shadow-xl'),
  {
    variants: {
      size: {
        medium: `w-screen max-w-md h-full`,
        large: `w-screen max-w-2xl h-full`,
        xlarge: `w-screen max-w-3xl h-full`,
        xxlarge: `w-screen max-w-4xl h-full`,
        xxxlarge: `w-screen max-w-5xl h-full`,
        xxxxlarge: `w-screen max-w-6xl h-full`,
      },
      align: {
        left: `
          left-0
          data-open:animate-panel-slide-left-out
          data-closed:animate-panel-slide-left-in
        `,
        right: `
          right-0
          data-open:animate-panel-slide-right-out
          data-closed:animate-panel-slide-right-in
        `,
      },
    },
  }
)

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
  const footerContent = customFooter ? (
    customFooter
  ) : (
    <div className="flex justify-end gap-2 p-4 bg-overlay border-t">
      <div>
        <Button disabled={loading} variant="default" onClick={() => (onCancel ? onCancel() : null)}>
          {cancelText}
        </Button>
      </div>
      {!!onConfirm && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button
                type="submit"
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
        <Dialog.Overlay className="z-50 fixed bg-alternative h-full w-full left-0 top-0 opacity-75 data-closed:animate-fade-out-overlay-bg data-open:animate-fade-in-overlay-bg" />
        <Dialog.Content
          className={sidePanelContentVariants({ align, size, className })}
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
          {header && (
            <header className="flex items-center space-y-1 py-4 px-4 bg-dash-sidebar sm:px-6 border-b h-(--header-height)">
              {header}
            </header>
          )}
          <div className="relative flex-1 overflow-y-auto">{children}</div>
          {!hideFooter && footerContent}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function Separator() {
  return <div className="w-full h-px my-2 bg-border"></div>
}

export function Content({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('px-4 sm:px-6', className)}>{children}</div>
}

SidePanel.Content = Content
SidePanel.Separator = Separator
export default SidePanel
