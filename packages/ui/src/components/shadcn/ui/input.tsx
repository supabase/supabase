import { VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'
import { SIZE_VARIANTS, SIZE_VARIANTS_DEFAULT } from '../../../lib/constants'
import { cn } from '../../../lib/utils/cn'

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof InputVariants> {}

const customClasses = ['bg-control']

const InputVariants = cva('', {
  variants: {
    size: {
      ...SIZE_VARIANTS,
    },
  },
  defaultVariants: {
    size: SIZE_VARIANTS_DEFAULT,
  },
})

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        {...props}
        className={cn(
          'flex h-10 w-full rounded-md border border-control bg-control px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background-control focus-visible:ring-offset-2 focus-visible:ring-offset-foreground-muted disabled:cursor-not-allowed disabled:opacity-50',
          InputVariants({ size }),
          ...customClasses,
          className
        )}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
