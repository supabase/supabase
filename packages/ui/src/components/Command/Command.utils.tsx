import * as React from 'react'
import { DialogProps } from '@radix-ui/react-dialog'
import { Command as CommandPrimitive, useCommandState } from 'cmdk-supabase'

import { cn } from './../../utils/cn'
import { Dialog, DialogContent } from './../Dialog'
import { IconSearch } from '../Icon/icons/IconSearch'
import { Modal } from '../Modal'
import { ModalProps } from '../Modal/Modal'

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn('flex h-full w-full flex-col overflow-hidden', className)}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

interface CommandDialogProps extends ModalProps {
  onKeyDown: any
}

const CommandDialog = ({ children, onKeyDown, ...props }: CommandDialogProps) => {
  return (
    <Modal {...props} hideFooter>
      {/* <DialogContent className="p-0 shadow-2xl [&_[dialog-overlay]]:bg-red-100"> */}
      <Command
        onKeyDown={onKeyDown}
        // shouldFilter={false}
        className={[
          '[&_[cmdk-group]]:px-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-scale-800 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-input]]:h-12',

          '[&_[cmdk-item]_svg]:mr-3',
          '[&_[cmdk-item]_svg]:h-5',
          '[&_[cmdk-item]_svg]:w-5',
          '[&_[cmdk-input-wrapper]_svg]:h-5',
          '[&_[cmdk-input-wrapper]_svg]:w-5',

          '[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0',
        ].join(' ')}
      >
        {children}
      </Command>
      {/* </DialogContent> */}
    </Modal>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, value, onValueChange, ...props }, ref) => (
  <div
    className="flex items-center border-b border-b-scale-500 dark:border-b-scale-500"
    cmdk-input-wrapper=""
  >
    {/* <IconSearch strokeWidth={2} className="text-scale-1200 mr-2 h-4 w-4 shrink-0 opacity-50" /> */}
    <CommandPrimitive.Input
      value={value}
      autoFocus
      onValueChange={onValueChange}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-md bg-transparent px-4 py-7 text-sm outline-none',
        'focus:shadow-none focus:ring-transparent',
        'placeholder:text-scale-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-scale-1200 border-0',
        className
      )}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('overflow-y-auto overflow-x-hidden', className)}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm text-scale-900"
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    // forceMount={props.forceMount}
    className={cn(
      'overflow-hidden py-3 px-2 text-scale-700 dark:text-scale-800 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-scale-900 [&_[cmdk-group-heading]]:dark:text-sca-300',
      className
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn(
      `h-px 
    w-full
    bg-scale-50
    `,
      className
    )}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    // forceMount={props.forceMount}
    className={cn(
      'text-scale-1100 relative flex cursor-default select-none items-center rounded-md py-1.5 px-2 text-sm outline-none aria-selected:bg-scale-500 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-scale-500',
      className
    )}
    {...props}
  />
))

const CommandItemStale = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'text-scale-1100 relative flex cursor-default select-none items-center rounded-md py-1.5 px-2 text-sm outline-none aria-selected:bg-scale-500 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-scale-500',
      className
    )}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        '[&:not(:last-child)]:hover:bg-scale-600 [&:not(:last-child)]:hover:cursor-pointer',
        'bg-scale-500 px-1.5 py-0.5 rounded text-xs text-scale-900',
        'last:bg-scale-600 last:text-scale-900',
        'justify-end',
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = 'CommandShortcut'

const CommandLabel = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span {...props} className={cn('grow', className)} />
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandItemStale,
  CommandShortcut,
  CommandSeparator,
  CommandLabel,
}
