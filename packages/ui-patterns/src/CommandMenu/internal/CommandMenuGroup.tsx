'use client'

import { forwardRef } from 'react'
import { cn, CommandGroup } from 'ui'

const CommandMenuGroup = forwardRef<
  React.ElementRef<typeof CommandGroup>,
  React.ComponentPropsWithoutRef<typeof CommandGroup>
>(({ className, ...props }, ref) => {
  return (
    <CommandGroup
      ref={ref}
      className={cn(
        'overflow-hidden py-3 px-2 text-foreground-lighter/60 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:pb-1.5 **:[[cmdk-group-heading]]:text-sm **:[[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-foreground-lighter/60',
        className
      )}
      {...props}
    />
  )
})
CommandMenuGroup.displayName = 'CommandMenuGroup'

export { CommandMenuGroup }
