'use client'

import type * as RadixPopoverTypes from '@radix-ui/react-popover'
import * as RadixPopover from '@radix-ui/react-popover'
import { X } from 'lucide-react'
import * as React from 'react'

import styleHandler from '../../lib/theme/styleHandler'

interface RootProps {
  align?: RadixPopoverTypes.PopoverContentProps['align']
  ariaLabel?: string
  arrow?: boolean
  children?: React.ReactNode
  className?: string
  defaultOpen?: boolean
  disabled?: boolean
  modal?: boolean
  onOpenChange?: RadixPopoverTypes.PopoverProps['onOpenChange']
  open?: boolean
  overlay?: React.ReactNode
  showClose?: boolean
  side?: RadixPopoverTypes.PopoverContentProps['side']
  sideOffset?: RadixPopoverTypes.PopoverContentProps['sideOffset']
  style?: React.CSSProperties
  header?: React.ReactNode
  footer?: React.ReactNode
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'content'
  'data-testid'?: string
}

/**
 * @deprecated Use `import { Popover_shadcn_ } from "ui"` instead
 */
function Popover({
  align = 'center',
  ariaLabel,
  arrow = false,
  children,
  className,
  defaultOpen = false,
  modal,
  onOpenChange,
  open,
  overlay,
  side = 'bottom',
  sideOffset = 6,
  style,
  header,
  footer,
  size = 'content',
  disabled,
  'data-testid': dataTestId,
}: RootProps) {
  const __styles = styleHandler('popover')

  let classes = [__styles.content, __styles.size[size]]
  if (className) {
    classes.push(className)
  }

  return (
    <RadixPopover.Root
      defaultOpen={defaultOpen}
      modal={modal}
      onOpenChange={onOpenChange}
      open={open}
    >
      <RadixPopover.Trigger
        // className={DropdownStyles['sbui-popover__trigger']}
        disabled={disabled}
        className={__styles.trigger}
        aria-label={ariaLabel}
        data-testid={dataTestId}
      >
        {children}
      </RadixPopover.Trigger>

      <RadixPopover.Portal>
        <RadixPopover.Content
          sideOffset={sideOffset}
          side={side}
          align={align}
          className={classes.join(' ')}
          style={style}
        >
          {arrow && (
            <RadixPopover.Arrow
              // className={DropdownStyles['sbui-popover__arrow']}
              offset={10}
            ></RadixPopover.Arrow>
          )}
          {header && <div className={__styles.header}>{header}</div>}
          {overlay}
          {footer && <div className={__styles.footer}>{footer}</div>}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}

/**
 * @deprecated Use ./Popover_shadcn_ instead
 */
function Close() {
  const __styles = styleHandler('popover')

  return (
    <RadixPopover.Close className={__styles.close}>
      <X size={14} strokeWidth={2} />
    </RadixPopover.Close>
  )
}

/**
 * @deprecated Use ./PopoverSeparator_Shadcn_ instead
 */
function Separator() {
  const __styles = styleHandler('popover')

  return <div className={__styles.separator}></div>
}

Popover.Separator = Separator
Popover.Close = Close
export default Popover
