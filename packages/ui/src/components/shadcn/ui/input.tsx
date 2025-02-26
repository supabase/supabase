import { VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'
import { SIZE_VARIANTS, SIZE_VARIANTS_DEFAULT } from '../../../lib/constants'
import { cn } from '../../../lib/utils/cn'

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof InputContainerVariants> {
  startContent?: React.ReactNode
  endContent?: React.ReactNode
}

export const InputContainerVariants = cva(
  cn(
    'flex items-center gap-2 relative w-full rounded-md border border-control bg-foreground/[.026] text-sm',
    'focus-within:outline-none focus-within:ring-2 focus-within:ring-background-control focus-within:ring-offset-2 focus-within:ring-offset-foreground-muted disabled:cursor-not-allowed disabled:opacity-50',
    'aria-[] aria-[invalid=true]:bg-destructive-200 aria-[invalid=true]:border-destructive-400 aria-[invalid=true]:focus-within:border-destructive aria-[invalid=true]:focus-within:border-destructive'
  ),
  {
    variants: {
      size: {
        ...SIZE_VARIANTS,
      },
    },
    defaultVariants: {
      size: SIZE_VARIANTS_DEFAULT,
    },
  }
)

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = 'small', startContent, endContent, disabled, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Combine refs to support both forwardRef and our internal ref
    React.useImperativeHandle(ref, () => inputRef.current!)

    // Handle container click to focus the input
    const handleContainerClick = React.useCallback(() => {
      if (!disabled && inputRef.current) {
        inputRef.current.focus()
      }
    }, [disabled])

    return (
      <div
        className={cn(InputContainerVariants({ size }), className)}
        data-disabled={disabled}
        onClick={handleContainerClick}
      >
        {startContent && <div>{startContent}</div>}
        <input
          type={type}
          ref={inputRef}
          disabled={disabled}
          className={cn(
            'w-full h-full bg-transparent border-0 outline-none focus:ring-0 focus:outline-none p-0',
            'py-3 placeholder:text-foreground-muted file:border-0 file:bg-transparent file:text-sm file:font-medium'
          )}
          {...props}
        />
        {endContent && <div>{endContent}</div>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
