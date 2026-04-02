import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-control bg-foreground/[.026] px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-foreground-muted focus:ring-background-control focus:border-control focus-visible:border-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-foreground-muted focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
