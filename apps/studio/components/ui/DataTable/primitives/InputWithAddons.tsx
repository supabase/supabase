import { cn } from 'ui'

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'

export interface InputWithAddonsProps extends InputHTMLAttributes<HTMLInputElement> {
  leading?: ReactNode
  trailing?: ReactNode
  containerClassName?: string
}

export const InputWithAddons = forwardRef<HTMLInputElement, InputWithAddonsProps>(
  ({ leading, trailing, containerClassName, className, ...props }, ref) => {
    return (
      <div
        className={cn(
          'group border-input ring-offset-background flex h-10 w-full rounded border bg-transparent text-sm overflow-hidden',
          'focus-within:ring-ring focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2',
          containerClassName
        )}
      >
        {leading ? (
          <div className="border-input bg-muted/50 border-r px-2.5 py-2 flex items-center justify-center">
            {leading}
          </div>
        ) : null}
        <input
          className={cn(
            'bg-background w-full px-3 py-2 focus:outline-none border-0 placeholder:text-muted-foreground ',
            'disabled:cursor-not-allowed disabled:opacity-50 text-sm',
            className
          )}
          ref={ref}
          {...props}
        />
        {trailing ? (
          <div className="border-input bg-muted/50 border-l px-3 py-2">{trailing}</div>
        ) : null}
      </div>
    )
  }
)
InputWithAddons.displayName = 'InputWithAddons'
