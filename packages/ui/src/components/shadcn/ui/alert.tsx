import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@ui/lib/utils'

const alertVariants = cva(
  cn(
    'relative w-full rounded-lg border p-4 [&:has(svg)]:pl-14 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
    '[&>svg]:w-[23px] [&>svg]:h-[23px] [&>svg]:p-1 [&>svg]:flex [&>svg]:rounded'
  ),
  {
    variants: {
      variant: {
        default:
          'text-foreground bg-alternative border-alternative [&>svg]:text-background [&>svg]:bg-foreground-strong',
        destructive:
          'text border-destructive-400 bg-destructive-200 [&>svg]:text-destructive-200 [&>svg]:bg-destructive-600',
        warning:
          'text-warning-100 dark:text-warning border-warning-400 bg-warning-200 [&>svg]:text-warning-200 [&>svg]:bg-warning-600',
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
