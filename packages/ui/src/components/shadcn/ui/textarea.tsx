import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-control hover:border-control-hover bg-field px-3 py-2 text-base md:text-sm placeholder:text-foreground-muted focus:border-control-hover focus-visible:border-control-hover focus-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200',
          'aria-[invalid=true]:bg-destructive-200 aria-[invalid=true]:border-destructive-400 aria-[invalid=true]:hover:border-destructive aria-[invalid=true]:focus:border-destructive aria-[invalid=true]:focus-visible:border-destructive',
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
