import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@ui/lib/utils'
import styleHandler from 'ui/src/lib/theme/styleHandler'

import { IconChevronRight } from '../../Icon/icons/IconChevronRight' 
import { IconCheck } from '../../Icon/icons/IconCheck'
import { IconTarget } from '../../Icon/icons/IconTarget'

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
>(({ className, inset, children, ...props }, ref) => {
  let __styles = styleHandler('dropdown')
  
  return (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      // 'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent',
      __styles.item,
      __styles.item_nested,
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <IconChevronRight className={__styles.right_slot} size={14} />
  </DropdownMenuPrimitive.SubTrigger>
)})
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
  let __styles = styleHandler('dropdown')

  return (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      // 'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      __styles.content,
      className
    )}
    {...props}
  />
)})
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  let __styles = styleHandler('dropdown')
  
  // Note: Dropdown previously expected an optional "size" prop, which we're dropping here
  // let classes = [__styles.content, __styles.size[props.size ?? "medium"]]
  let classes = [__styles.content]
  
  if (className) {
    classes.push(className)
  }
  
  return (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        classes,
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
)})
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => {
  let __styles = styleHandler('dropdown') 
  
  return (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      // 'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-foreground text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      __styles.item, className, props.disabled && __styles.disabled,
      inset && 'pl-8'
    )}
    {...props}
  />
)})
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => {
  let __styles = styleHandler('dropdown')

  return (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      // 'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      __styles.item, __styles.input,
      props.disabled && __styles.disabled,
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <IconCheck size="tiny" strokeWidth={3} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
)})
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => {
  let __styles = styleHandler('dropdown')

  return (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      // 'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      __styles.item, __styles.input,
      props.disabled && __styles.disabled,
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <IconTarget strokeWidth={6} size={10} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
)})
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => {
  let __styles = styleHandler('dropdown')

  return (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      // 'px-2 py-1.5 text-sm font-semibold'
      __styles.label
      , inset && 'pl-8', className)}
    {...props}
  />
)})
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => {
  let __styles = styleHandler('dropdown')

  return (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn(__styles.separator, className)}
    {...props}
  />
)})
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuRightSlot = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  let __styles = styleHandler('dropdown')
  return <span data-component="right_slot" className={cn(
    // 'ml-auto text-xs tracking-widest opacity-60',
    __styles.right_slot,
    className)} {...props} />
}
DropdownMenuRightSlot.displayName = 'DropdownMenuRightSlot'

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRightSlot,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
