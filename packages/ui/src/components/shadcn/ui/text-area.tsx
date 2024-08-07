import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-10 w-full rounded-md border border-control bg-foreground/[.026] px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background-control focus-visible:ring-offset-2 focus-visible:ring-offset-foreground-muted disabled:cursor-not-allowed disabled:opacity-50',
          'aria-[invalid=true]:bg-destructive-200 aria-[invalid=true]:border-destructive-400 aria-[invalid=true]:focus:border-destructive aria-[invalid=true]:focus-visible:border-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

TextArea.displayName = 'Input'

export { TextArea }
