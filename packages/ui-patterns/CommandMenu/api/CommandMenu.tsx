import { Command as CommandPrimitive } from 'cmdk'
import { type PropsWithChildren, forwardRef } from 'react'

import { Dialog, DialogContent, cn } from 'ui'

import { useCommandPagesContext } from '../internal/Context'

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
  const { commandPages, pageStack } = useCommandPagesContext()
  const currentPage = pageStack.at(-1)

  if (currentPage && currentPage in commandPages) {
    const Component = commandPages[currentPage]
    return <Component />
  }

  return <CommandWrapper>{children}</CommandWrapper>
}

const CommandMenu = ({ children, open }: PropsWithChildren<{ open: boolean }>) => {
  return (
    <Dialog open={open}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <PageSwitch>{children}</PageSwitch>
      </DialogContent>
    </Dialog>
  )
}

export { CommandMenu }
