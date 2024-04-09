import { forwardRef } from 'react'

import { CommandEmpty_Shadcn_ } from 'ui'

const CommandEmpty = forwardRef<
  React.ElementRef<typeof CommandEmpty_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof CommandEmpty_Shadcn_>
>((props, ref) => (
  <CommandEmpty_Shadcn_ ref={ref} className="py-6 text-center text-sm" {...props} />
))
CommandEmpty.displayName = CommandEmpty_Shadcn_.displayName

export { CommandEmpty }
