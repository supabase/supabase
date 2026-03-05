import { cva, VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { SIZE_VARIANTS, SIZE_VARIANTS_DEFAULT } from '../../../lib/constants'
import { cn } from '../../../lib/utils/cn'

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof InputVariants> {}

export const InputVariants = cva(
  cn(
    'flex h-10 w-full rounded-md border border-control read-only:border-button bg-foreground/[.026] px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground-muted read-only:text-foreground-light',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:text-foreground-muted',
    'aria-[] aria-[invalid=true]:bg-destructive-200 aria-[invalid=true]:border-destructive-400 aria-[invalid=true]:focus:border-destructive aria-[invalid=true]:focus-visible:border-destructive'
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
  ({ className, type, size = 'small', ...props }, ref) => {
    return (
      <input type={type} ref={ref} {...props} className={cn(InputVariants({ size }), className)} />
    )
  }
)

Input.displayName = 'Input'

export { Input }
