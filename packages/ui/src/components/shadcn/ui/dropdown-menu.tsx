import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@ui/lib/utils'

import { IconChevronRight } from '../../Icon/icons/IconChevronRight'
import { IconCheck } from '../../Icon/icons/IconCheck'
import { IconTarget } from '../../Icon/icons/IconTarget'

export type DropdownMenuVariantsProps = VariantProps<typeof dropdownMenuVariants>
const dropdownMenuVariants = cva('', {
  variants: {
    content: {
      true: `
        overflow-hidden
        z-40
        bg-overlay
        border-overlay
        rounded
        shadow-lg
        py-1.5
        origin-dropdown
        data-open:animate-dropdown-content-show
        data-closed:animate-dropdown-content-hide
        min-w-fit
        antialiased
        data-[state=open]:animate-in
        data-[state=closed]:animate-out
        data-[state=closed]:fade-out-0
        data-[state=open]:fade-in-0
        data-[state=closed]:zoom-out-95
        data-[state=open]:zoom-in-95
        data-[side=bottom]:slide-in-from-top-2
        data-[side=left]:slide-in-from-right-2
        data-[side=right]:slide-in-from-left-2
        data-[side=top]:slide-in-from-bottom-2
      `,
    },
    item: {
      true: `
        select-none
        group
        relative
        flex items-center space-x-2
        text-sm
        text-light
        px-4 py-1.5
        cursor-pointer
        focus:bg-overlay-hover
        focus:text
        border-none
        transition-colors
        outline-none
        focus:outline-none
        data-[disabled]:pointer-events-none
        data-[disabled]:opacity-50
      `,
    },
    item_nested: {
      true: `
        border-none
        focus:outline-none
        focus:bg-overlay-hover
        focus:text
        data-open:bg-overlay
        data-open:text
      `,
    },
    size: {
      tiny: `w-40`,
      small: `w-48`,
      medium: `w-64`,
      large: `w-80`,
      xlarge: `w-96`,
      content: `w-auto`,
    },
    arrow: {
      true: `
        fill-current
        border-0 border-t
      `,
    },
    disabled: {
      true: `opacity-50 cursor-default`,
    },
    label: {
      true: `
        text-lighter
        px-4 flex items-center space-x-2 py-1.5
        text-xs
      `,
    },
    separator: {
      true: `
        w-full
        my-2
        border-t-[1px]
      `,
    },
    misc: {
      true: `
        px-4 py-1.5
      `,
    },
    check: {
      true: `
        absolute left-3
        flex items-center
        data-checked:text
      `,
    },
    input: {
      true: `
        flex items-center space-x-0 pl-8 pr-4
      `,
    },
    right_slot: {
      true: `
        text-lighter
        group-focus:text-light
        absolute
        -translate-y-1/2
        right-2
        top-1/2
        ml-auto text-xs tracking-widest opacity-60
      `,
    },
    item_indicator: {
      true: `
        absolute
        left-2
        text
        flex items-center justify-center
        h-3.5 w-3.5
      `,
    },
    inset: {
      true: 'pl-8',
    },
  },
})

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(dropdownMenuVariants({ item: true, item_nested: true, inset }), className)}
    {...props}
  >
    {children}
    <IconChevronRight className={dropdownMenuVariants({ right_slot: true })} size={14} />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(dropdownMenuVariants({ content: true }), className)}
    {...props}
  />
))
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(dropdownMenuVariants({ content: true }), className)}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(dropdownMenuVariants({ item: true, disabled: props.disabled, inset }), className)}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      dropdownMenuVariants({ item: true, disabled: props.disabled, input: true }),
      className
    )}
    checked={checked}
    {...props}
  >
    <DropdownMenuPrimitive.ItemIndicator
      className={cn(dropdownMenuVariants({ item_indicator: true }))}
    >
      <IconCheck size="tiny" strokeWidth={3} />
    </DropdownMenuPrimitive.ItemIndicator>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      dropdownMenuVariants({ item: true, disabled: props.disabled, input: true }),
      className
    )}
    {...props}
  >
    <DropdownMenuPrimitive.ItemIndicator
      className={cn(dropdownMenuVariants({ item_indicator: true }))}
    >
      <IconTarget strokeWidth={6} size={10} />
    </DropdownMenuPrimitive.ItemIndicator>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(dropdownMenuVariants({ label: true, inset }), className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn(dropdownMenuVariants({ separator: true }), className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuRightSlot = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    data-component="right_slot"
    className={cn(dropdownMenuVariants({ right_slot: true }), className)}
    {...props}
  />
)

DropdownMenuRightSlot.displayName = 'DropdownMenuRightSlot'

export {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuTrigger as ShadcnDropdownMenuTrigger,
  DropdownMenuContent as ShadcnDropdownMenuContent,
  DropdownMenuItem as ShadcnDropdownMenuItem,
  DropdownMenuCheckboxItem as ShadcnDropdownMenuCheckboxItem,
  DropdownMenuRadioItem as ShadcnDropdownMenuRadioItem,
  DropdownMenuLabel as ShadcnDropdownMenuLabel,
  DropdownMenuSeparator as ShadcnDropdownMenuSeparator,
  DropdownMenuRightSlot as ShadcnDropdownMenuRightSlot,
  DropdownMenuGroup as ShadcnDropdownMenuGroup,
  DropdownMenuPortal as ShadcnDropdownMenuPortal,
  DropdownMenuSub as ShadcnDropdownMenuSub,
  DropdownMenuSubContent as ShadcnDropdownMenuSubContent,
  DropdownMenuSubTrigger as ShadcnDropdownMenuSubTrigger,
  DropdownMenuRadioGroup as ShadcnDropdownMenuRadioGroup,
}
