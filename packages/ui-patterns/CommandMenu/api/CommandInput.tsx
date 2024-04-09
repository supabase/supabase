import { forwardRef } from 'react'

import { CommandInput_Shadcn_, cn } from 'ui'

import { useQuery, useSetQuery } from './hooks/queryHooks'

const CommandInput = forwardRef<
  React.ElementRef<typeof CommandInput_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof CommandInput_Shadcn_>
>(({ className, ...props }, ref) => {
  const query = useQuery()
  const setQuery = useSetQuery()

  return (
    <CommandInput_Shadcn_
      autoFocus
      ref={ref}
      value={query}
      onValueChange={setQuery}
      placeholder="Type a command or search..."
      className={cn(
        'flex h-11 w-full rounded-md bg-transparent px-4 py-7 text-sm outline-none',
        'focus:shadow-none focus:ring-transparent',
        'text-foreground-light placeholder:text-border-stronger disabled:cursor-not-allowed disabled:opacity-50 border-0',
        className
      )}
      {...props}
    />
  )
})

CommandInput.displayName = CommandInput_Shadcn_.displayName

export { CommandInput }
