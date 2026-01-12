// Copy Pasta from: https://github.com/sadmann7/shadcn-table/blob/main/src/components/kbd.tsx#L54
import { ComponentPropsWithoutRef, forwardRef } from 'react'

import { cn } from 'ui'

export const kdbClassName = cn(
  'select-none rounded border px-1.5 py-px font-mono text-[0.7rem] font-normal font-mono shadow-sm disabled:opacity-50',
  'bg-background text-foreground'
)

export const Kbd = forwardRef<HTMLUnknownElement, ComponentPropsWithoutRef<'kbd'>>(
  ({ children, className, ...props }, ref) => {
    return (
      <kbd className={cn(kdbClassName, className)} ref={ref} {...props}>
        {children}
      </kbd>
    )
  }
)

Kbd.displayName = 'Kbd'
