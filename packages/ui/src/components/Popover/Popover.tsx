import * as React from 'react'
import * as RadixPopover from '@radix-ui/react-popover'
import type * as RadixPopoverTypes from '@radix-ui/react-popover/'

import { IconX } from '../Icon/icons/IconX'
import styleHandler from '../../lib/theme/styleHandler'

interface RootProps {
  align?: RadixPopoverTypes.PopoverContentProps['align']
  ariaLabel?: string
  arrow?: boolean
  children?: React.ReactNode
  className?: string
  defaultOpen?: boolean
  modal?: boolean
  onOpenChange?: RadixPopoverTypes.PopoverProps['onOpenChange']
  open?: boolean
  overlay?: React.ReactNode
  portalled?: boolean
  showClose?: boolean
  side?: RadixPopoverTypes.PopoverContentProps['side']
  sideOffset?: RadixPopoverTypes.PopoverContentProps['sideOffset']
  style?: React.CSSProperties
  header?: React.ReactNode
  footer?: React.ReactNode
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'content'
}

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
  portalled,
  side = 'bottom',
  sideOffset = 6,
  style,
  header,
  footer,
  size = 'content',
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
        className={__styles.trigger}
        aria-label={ariaLabel}
      >
        {children}
      </RadixPopover.Trigger>

      <RadixPopover.Content
        sideOffset={sideOffset}
        side={side}
        align={align}
        className={classes.join(' ')}
        style={style}
        portalled={portalled}
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
    </RadixPopover.Root>
  )
}

function Close() {
  const __styles = styleHandler('popover')

  return (
    <RadixPopover.Close className={__styles.close}>
      <IconX size={14} strokeWidth={2} />
    </RadixPopover.Close>
  )
}

function Separator() {
  const __styles = styleHandler('popover')

  return <div className={__styles.separator}></div>
}

Popover.Separator = Separator
Popover.Close = Close
export default Popover
