import { Search } from 'lucide-react'
import { forwardRef } from 'react'

import { CommandInput_Shadcn_, cn } from 'ui'

const CommandInput = forwardRef<
  React.ElementRef<typeof CommandInput_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof CommandInput_Shadcn_>
>(({ className, ...props }, ref) => (
  <CommandInput_Shadcn_ ref={ref} className={cn(className)} {...props} />
))

CommandInput.displayName = CommandInput_Shadcn_.displayName

export { CommandInput }
