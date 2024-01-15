import * as Dialog from '@radix-ui/react-dialog'
import * as Tooltip from '@radix-ui/react-tooltip'
import React from 'react'
import { Button } from '../../../index'
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
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger asChild>
            <div>
              <Button
                htmlType="submit"
                disabled={disabled || loading}
                loading={loading}
                onClick={() => (onConfirm ? onConfirm() : null)}
              >
                {confirmText}
              </Button>
            </div>
          </Tooltip.Trigger>
          {tooltip !== undefined && (
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                    'border border-background',
                  ].join(' ')}
                >
                  <span className="text-xs text-foreground">{tooltip}</span>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          )}
        </Tooltip.Root>
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
        <Dialog.Trigger className={__styles.trigger}>{triggerElement}</Dialog.Trigger>
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
