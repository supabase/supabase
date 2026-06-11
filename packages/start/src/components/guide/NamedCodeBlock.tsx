import { type PropsWithChildren } from 'react'
import { cn } from 'ui'

export function NamedCodeBlock({ name, children }: PropsWithChildren<{ name: string }>) {
  return (
    <div className="shiki-wrapper not-prose w-full space-y-2">
      <h6
        className={cn(
          'flex w-fit items-center text-center',
          'rounded-sm border border-stronger bg-selection shadow-xs',
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
