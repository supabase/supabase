import { cva, VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { SIZE_VARIANTS, SIZE_VARIANTS_DEFAULT } from '../../../lib/constants'
import { cn } from '../../../lib/utils/cn'

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof InputVariants> {}

export const InputVariants = cva(
  cn(
    'flex h-10 w-full rounded-md border border-control read-only:border-button bg-foreground/[.026] px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground-muted read-only:text-foreground-light',
    'focus:ring-background-control focus:border-control focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-background-control focus-visible:ring-offset-2 focus-visible:ring-offset-foreground-muted disabled:cursor-not-allowed disabled:text-foreground-muted',
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
  (
    { className, type, size = 'small', onChange, onBlur, onFocus, value: valueProp, ...props },
    ref
  ) => {
    // Handle the value locally to avoid issues with numbers
    const [value, setValue] = React.useState(valueProp ?? '')

    const handleChange = (event: React.ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
      const target = event.target
      // Always show users the value they entered even though (in the case of numbers), it's not valid yet.
      // This avoids issues when users deletes the current value or when they enter numbers like 0.123
      setValue(target.value)

      if (type !== 'number') {
        onChange && onChange(event)
        return
      }

      const isNumber = target.valueAsNumber != null && !isNaN(target.valueAsNumber)

      if (isNumber) {
        onChange && onChange(event)
      }
    }

    const hasFocus = React.useRef(false)
    const handleFocus = (event: React.FocusEvent<HTMLInputElement, Element>) => {
      hasFocus.current = true
      onFocus && onFocus(event)
    }

    const handleBlur = (event: React.FocusEvent<HTMLInputElement, Element>) => {
      hasFocus.current = false
      onBlur && onBlur(event)
    }

    // Update the input text when the value changed and users aren't currently editing it
    React.useEffect(() => {
      if (!hasFocus.current) {
        setValue(valueProp ?? '')
      }
    }, [valueProp])

    return (
      <input
        type={type}
        ref={ref}
        {...props}
        className={cn(InputVariants({ size }), className)}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        value={value}
      />
    )
  }
)

Input.displayName = 'Input'

const noop = () => {}

export { Input }
