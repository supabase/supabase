import { type PropsWithChildren } from 'react'

import { cn } from 'ui'

export function NamedCodeBlock({ name, children }: PropsWithChildren<{ name: string }>) {
  return (
    <div className="shiki-wrapper w-full space-y-2">
      <h6
        className={cn(
          'w-fit flex items-center text-center',
          'shadow-sm rounded border border-stronger bg-selection',
          'px-2.5 py-1',
          'text-xs text-foreground'
        )}
      >
        {name}
      </h6>
      {children}
    </div>
  )
}
