import { Command as CommandPrimitive } from 'cmdk'
import { forwardRef } from 'react'

import { cn } from 'ui'

type ICommand = IActionCommand | IRouteCommand

type IBaseCommand = {
  id: string
  name: string
  keywords?: Array<string>
  shortcut?: string
}

type IActionCommand = IBaseCommand & {
  action: () => void
}

type IRouteCommand = IBaseCommand & {
  route: `/${string}`
}

const CommandItem = forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

export { CommandItem }
export type { ICommand }
