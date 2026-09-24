import { type PropsWithChildren } from 'react'
import { cn } from 'ui'

export function NamedCodeBlock({ name, children }: PropsWithChildren<{ name: string }>) {
  return (
    <div
      className={cn(
        'shiki-wrapper w-full isolate',
        '[&_.shiki]:rounded-tl-none [&_.shiki]:my-0!',
        '[&_.shiki_.code-scroll]:rounded-tl-none'
      )}
    >
      <span
        className={cn(
          'relative z-1 -mb-px flex w-fit items-center px-3 py-2',
          'rounded-t-lg border border-b-0 border-default bg-200',
          'text-xs text-foreground'
        )}
      >
        {name}
      </span>
      {children}
    </div>
  )
}
