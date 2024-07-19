'use client'

import { forwardRef } from 'react'

import { CommandInput_Shadcn_, cn } from 'ui'

import { useQuery, useSetQuery } from './hooks/queryHooks'
import { useCommandMenuTouchGestures } from './hooks/viewHooks'

const CommandInput = forwardRef<
  React.ElementRef<typeof CommandInput_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof CommandInput_Shadcn_>
>(({ className, ...props }, ref) => {
  const query = useQuery()
  const setQuery = useSetQuery()

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useCommandMenuTouchGestures()

  return (
    <CommandInput_Shadcn_
      autoFocus
      ref={ref}
      value={query}
      onValueChange={setQuery}
      placeholder="Type a command or search..."
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'flex h-11 w-full rounded-md bg-transparent px-4 py-7 outline-none',
        'focus:shadow-none focus:ring-transparent',
        'text-foreground-light placeholder:text-foreground-muted disabled:cursor-not-allowed disabled:opacity-50 border-0',
        className
      )}
      {...props}
    />
  )
})

CommandInput.displayName = CommandInput_Shadcn_.displayName

export { CommandInput }
