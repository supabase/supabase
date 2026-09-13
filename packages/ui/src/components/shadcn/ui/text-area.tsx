import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Legacy TextArea. Prefer `Textarea` from `./textarea` for new work.
 * Kept in sync with the shadcn Textarea control surface (field well + control-hover).
 */
const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-10 w-full rounded-md border border-control hover:border-control-hover bg-field px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground-muted',
          'focus:border-control-hover focus-visible:border-control-hover focus-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200',
          'aria-[invalid=true]:bg-destructive-200 aria-[invalid=true]:border-destructive-400 aria-[invalid=true]:hover:border-destructive aria-[invalid=true]:focus:border-destructive aria-[invalid=true]:focus-visible:border-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

TextArea.displayName = 'TextArea'

export { TextArea }
