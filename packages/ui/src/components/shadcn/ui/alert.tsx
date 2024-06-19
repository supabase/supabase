import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

// Ivan: replaced [&:has(svg)]:pl-14 with [&>svg~*]:pl-10 cause of github.com/shadcn-ui/ui/issues/998
export const alertVariants = cva(
  cn(
    'relative w-full text-sm rounded-lg border p-4 [&>svg~*]:pl-10 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
    '[&>svg]:w-[23px] [&>svg]:h-[23px] [&>svg]:p-1 [&>svg]:flex [&>svg]:rounded'
  ),
  {
    variants: {
      variant: {
        default:
          'text-foreground bg-alternative border-alternative [&>svg]:text-background [&>svg]:bg-foreground',
        destructive:
          'text border-destructive-400 bg-destructive-200 [&>svg]:text-destructive-200 [&>svg]:bg-destructive-600',
        warning:
          'border-warning-400 bg-warning-200 [&>svg]:text-warning-200 [&>svg]:bg-warning-600',
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
  ({ className, ...props }, ref) => <h5 ref={ref} className={cn('mb-1', className)} {...props} />
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed text-foreground-light font-normal', className)}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertDescription, AlertTitle }
