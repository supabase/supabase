import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

export const alertVariants = cva(
  cn(
    // Container
    'relative w-full text-sm rounded-lg border p-4',
    // Icon SVG
    '[&>svg~*]:pl-10 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg]:w-[23px] [&>svg]:h-[23px] [&>svg]:p-1 [&>svg]:flex [&>svg]:rounded'
  ),
  {
    variants: {
      variant: {
        default:
          'bg-surface-200/25 border-default text-foreground [&>svg]:text-background [&>svg]:bg-foreground',
        destructive:
          'bg-destructive-200 border-destructive-400 [&>svg]:text-destructive-200 [&>svg]:bg-destructive-600',
        warning:
          'bg-warning-200 border-warning-400 [&>svg]:text-warning-200 [&>svg]:bg-warning-600',
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
  ({ className, ...props }, ref) => <h5 ref={ref} className={cn('mb-0.5', className)} {...props} />
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  // Automatically wrap primitive text nodes (string/number) in <p> tags for semantic HTML
  const content =
    typeof children === 'string' || typeof children === 'number' ? <p>{children}</p> : children

  return (
    <div
      ref={ref}
      className={cn(
        'text-sm text-foreground-light font-normal',
        // Optically align text in container
        'mb-0.5',
        // Handle paragraphs
        '[&_p]:mt-0 [&_p]:mb-1.5 [&_p:last-child]:mb-0',
        className
      )}
      {...props}
    >
      {content}
    </div>
  )
})
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertDescription, AlertTitle }
