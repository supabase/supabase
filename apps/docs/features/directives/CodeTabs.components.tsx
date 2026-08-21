import { type PropsWithChildren } from 'react'
import { cn } from 'ui'

export function NamedCodeBlock({ name, children }: PropsWithChildren<{ name: string }>) {
  return (
    <div className="shiki-wrapper w-full space-y-2">
      <span
        className={cn(
          'w-fit flex items-center text-center',
          'shadow-xs rounded-sm border border-stronger bg-selection',
          'px-2.5 py-1',
          'text-xs font-heading font-semibold text-foreground'
        )}
      >
        {name}
      </span>
      {children}
    </div>
  )
}
