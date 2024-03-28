import { Command as CommandPrimitive } from 'cmdk'
import { type PropsWithChildren, forwardRef, useEffect } from 'react'

import { Dialog, DialogContent, cn } from 'ui'

import { usePageComponent } from './hooks/pagesHooks'
import { useCommandMenuVisible, useToggleCommandMenu } from './hooks/viewHooks'

const CommandWrapper = forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
      className
    )}
    {...props}
  />
))
CommandWrapper.displayName = CommandPrimitive.displayName

const PageSwitch = ({ children }: PropsWithChildren) => {
  const PageComponent = usePageComponent()

  return PageComponent ? <PageComponent /> : <CommandWrapper>{children}</CommandWrapper>
}

const CommandMenu = ({ children }: PropsWithChildren) => {
  const open = useCommandMenuVisible()
  const toggleOpen = useToggleCommandMenu()

  return (
    <Dialog open={open} onOpenChange={toggleOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <PageSwitch>{children}</PageSwitch>
      </DialogContent>
    </Dialog>
  )
}

export { CommandMenu }
