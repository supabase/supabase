import { forwardRef } from 'react'

import { CommandItem_Shadcn_, cn } from 'ui'

type ICommand = IActionCommand | IRouteCommand

type IBaseCommand = {
  id: string
  name: string
  keywords?: Array<string>
  shortcut?: string
  forceMount?: boolean
}

type IActionCommand = IBaseCommand & {
  action: () => void
}

type IRouteCommand = IBaseCommand & {
  route: `/${string}`
}

const CommandItem = forwardRef<
  React.ElementRef<typeof CommandItem_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof CommandItem_Shadcn_>
>(({ className, ...props }, ref) => (
  <CommandItem_Shadcn_ ref={ref} className={cn(className)} {...props} />
))
CommandItem.displayName = CommandItem_Shadcn_.displayName

export { CommandItem }
export type { ICommand }
