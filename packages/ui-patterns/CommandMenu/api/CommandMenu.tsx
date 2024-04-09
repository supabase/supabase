import { type PropsWithChildren, forwardRef } from 'react'

import { Command_Shadcn_, Dialog, DialogContent, cn } from 'ui'

import { usePageComponent } from './hooks/pagesHooks'
import { useCommandMenuVisible, useToggleCommandMenu } from './hooks/viewHooks'

const CommandWrapper = forwardRef<
  React.ElementRef<typeof Command_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof Command_Shadcn_>
>(({ className, ...props }, ref) => (
  <Command_Shadcn_ ref={ref} className={cn(className)} {...props} />
))
CommandWrapper.displayName = Command_Shadcn_.displayName

const PageSwitch = ({ children }: PropsWithChildren) => {
  const PageComponent = usePageComponent()

  return PageComponent ? <PageComponent /> : <CommandWrapper>{children}</CommandWrapper>
}

const CommandMenu = ({ children }: PropsWithChildren) => {
  const open = useCommandMenuVisible()
  const toggleOpen = useToggleCommandMenu()

  return (
    <Dialog open={open} onOpenChange={toggleOpen}>
      <DialogContent>
        <PageSwitch>{children}</PageSwitch>
      </DialogContent>
    </Dialog>
  )
}

export { CommandMenu }
