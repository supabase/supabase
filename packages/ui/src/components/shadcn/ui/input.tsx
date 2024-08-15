import { VariantProps, cva } from 'class-variance-authority'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { SIZE_VARIANTS, SIZE_VARIANTS_DEFAULT } from '../../../lib/constants'
import { cn } from '../../../lib/utils/cn'

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof InputVariants> {}

const InputVariants = cva('aria-[]', {
  variants: {
    size: {
      ...SIZE_VARIANTS,
    },
  },
  defaultVariants: {
    size: SIZE_VARIANTS_DEFAULT,
  },
})

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = 'small', ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => inputRef.current!)

    // Prevent the number input from incrementing/decrementing
    // as you scroll past while scrolling the page
    useEffect(() => {
      const input = inputRef.current
      if (type === 'number' && input) {
        const handleWheel = (event: WheelEvent) => {
          if (document.activeElement === input) {
            event.preventDefault()
          }
        }

        input.addEventListener('wheel', handleWheel)
        return () => input.removeEventListener('wheel', handleWheel)
      }
    }, [type])

    return (
      <input
        type={type}
        ref={inputRef}
        {...props}
        className={cn(
          'flex h-10 w-full rounded-md border border-control bg-foreground/[.026] px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background-control focus-visible:ring-offset-2 focus-visible:ring-offset-foreground-muted disabled:cursor-not-allowed disabled:opacity-50',
          'aria-[invalid=true]:bg-destructive-200 aria-[invalid=true]:border-destructive-400 aria-[invalid=true]:focus:border-destructive aria-[invalid=true]:focus-visible:border-destructive',
          InputVariants({ size }),
          className
        )}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
