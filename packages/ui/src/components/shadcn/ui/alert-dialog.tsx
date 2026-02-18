'use client'

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { cva, VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'
import { ButtonVariantProps, buttonVariants } from './../../Button'

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = ({ children, ...props }: AlertDialogPrimitive.AlertDialogPortalProps) => (
  <AlertDialogPrimitive.Portal {...props}>
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {children}
    </div>
  </AlertDialogPrimitive.Portal>
)
AlertDialogPortal.displayName = AlertDialogPrimitive.Portal.displayName

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay> & { centered?: boolean }
>(({ className, centered = true, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'bg-black/40 backdrop-blur-sm',
      'z-50 fixed inset-0 grid place-items-center overflow-y-auto data-closed:animate-overlay-hide py-8',
      !centered && 'flex flex-col flex-start pb-8 sm:pt-12 md:pt-20 lg:pt-32 xl:pt-40 px-5',
      className
    )}
    {...props}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContentVariants = cva(
  cn(
    'relative z-50 w-full max-w-screen border shadow-md dark:shadow-sm',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    'data-[state=closed]:slide-out-to-left-[0%] data-[state=closed]:slide-out-to-top-[0%]',
    'data-[state=open]:slide-in-from-left-[0%] data-[state=open]:slide-in-from-top-[0%]',
    'sm:rounded-lg md:w-full',
    'bg-dash-sidebar'
  ),
  {
    variants: {
      size: {
        tiny: `sm:align-middle sm:w-full sm:max-w-xs`,
        small: `sm:align-middle sm:w-full sm:max-w-sm`,
        medium: `sm:align-middle sm:w-full sm:max-w-lg`,
        large: `sm:align-middle sm:w-full md:max-w-xl`,
        xlarge: `sm:align-middle sm:w-full md:max-w-3xl`,
        xxlarge: `sm:align-middle sm:w-full md:max-w-6xl`,
        xxxlarge: `sm:align-middle sm:w-full md:max-w-7xl`,
      },
    },
    defaultVariants: {
      size: 'small',
    },
  }
)

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> &
    VariantProps<typeof AlertDialogContentVariants> & {
      hideClose?: boolean
      dialogOverlayProps?: React.ComponentPropsWithoutRef<typeof AlertDialogOverlay>
      centered?: boolean
    }
>(({ className, children, size, dialogOverlayProps, centered = true, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay centered={centered} {...dialogOverlayProps}>
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(AlertDialogContentVariants({ size }), className)}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogOverlay>
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col text-left', className)} {...props} />
)
AlertDialogHeader.displayName = 'AlertDialogHeader'

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 border-t py-3 px-5',
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = 'AlertDialogFooter'

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn('text-base text-foreground border-b px-5 py-3', className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn(
      'text-sm text-foreground-light px-5',
      // Optically align text vertically
      ' pt-3.5 pb-4',
      className
    )}
    {...props}
  />
))
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

type AlertDialogActionProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & {
  variant?: NonNullable<ButtonVariantProps['type']>
}

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  AlertDialogActionProps
>(({ className, variant = 'primary', type = 'button', ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    type={type}
    className={cn(buttonVariants({ type: variant, size: 'tiny' }), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ type: 'default', size: 'tiny' }), 'mt-2 sm:mt-0', className)}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
}
