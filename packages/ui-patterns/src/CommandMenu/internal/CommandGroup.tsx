'use client'

import { forwardRef } from 'react'
import { cn, CommandGroup_Shadcn_ } from 'ui'

const CommandGroup = forwardRef<
  React.ElementRef<typeof CommandGroup_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof CommandGroup_Shadcn_>
>(({ className, ...props }, ref) => {
  return (
    <CommandGroup_Shadcn_
      ref={ref}
      className={cn(
        'overflow-hidden py-3 px-2 text-foreground-lighter/60 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-foreground-lighter/60',
        className
      )}
      {...props}
    />
  )
})
CommandGroup.displayName = CommandGroup_Shadcn_.displayName

export { CommandGroup }
