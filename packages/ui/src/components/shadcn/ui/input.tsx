import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const customClasses = ['bg-control']

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-control bg-control px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background-control focus-visible:ring-offset-2 focus-visible:ring-offset-foreground-muted disabled:cursor-not-allowed disabled:opacity-50',
          ...customClasses,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
