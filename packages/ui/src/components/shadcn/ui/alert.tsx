import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@ui/lib/utils'



const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&:has(svg)]:pl-14 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground'
  // custom
  + ' [&>svg]:w-[23px] [&>svg]:h-[23px] [&>svg]:p-1 [&>svg]:flex [&>svg]:rounded',
  {
    variants: {
      variant: {
        default:  
          'text-foreground' + 
          // removed `bg-background`

          // custom styles
          ' bg-alternative [&>svg]:text-background [&>svg]:bg-foreground-strong',
        destructive:
          'text-destructive' + 
          // removed 'border-destructive/50 dark:border-destructive [&>svg]:text-destructive'

          // custom styles
          ' border-destructive-300 bg-destructive-400 [&>svg]:text-destructive-400 [&>svg]:bg-destructive',
        
        /**
         * custom variant
         */
        warning:
          'text-warning border-warning-300 bg-warning-400 [&>svg]:text-warning-400 [&>svg]:bg-warning',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('mb-1 leading-none tracking-tight', className)} {...props} />
  )
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed text-light font-normal', className)}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
