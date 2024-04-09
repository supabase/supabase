import { forwardRef } from 'react'

import { CommandGroup_Shadcn_, cn } from 'ui'

const CommandGroup = forwardRef<
  React.ElementRef<typeof CommandGroup_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof CommandGroup_Shadcn_>
>(({ className, ...props }, ref) => (
  <CommandGroup_Shadcn_ ref={ref} className={cn(className)} {...props} />
))
CommandGroup.displayName = CommandGroup_Shadcn_.displayName

export { CommandGroup }
