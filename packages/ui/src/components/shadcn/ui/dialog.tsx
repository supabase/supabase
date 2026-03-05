'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { DialogProps } from '@radix-ui/react-dialog'
import { cva, VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

export const DIALOG_PADDING_Y_SMALL = 'py-4'
export const DIALOG_PADDING_X_SMALL = 'px-4 md:px-5'

export const DIALOG_PADDING_Y = 'py-6'
export const DIALOG_PADDING_X = 'px-4 md:px-7'

const DialogPaddingVariants = cva('', {
  variants: {
    padding: {
      medium: `${DIALOG_PADDING_Y} ${DIALOG_PADDING_X}`,
      small: `${DIALOG_PADDING_Y_SMALL} ${DIALOG_PADDING_X_SMALL}`,
    },
  },
  defaultVariants: {
    padding: 'small',
  },
})

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = (props: DialogPrimitive.DialogPortalProps) => (
  <DialogPrimitive.Portal {...props} />
)
DialogPortal.displayName = DialogPrimitive.Portal.displayName

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & { centered?: boolean }
>(({ className, centered = true, ...props }, ref) => (
  <DialogPrimitive.Overlay
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
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContentVariants = cva(
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
      size: 'medium',
    },
  }
)

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
    VariantProps<typeof DialogContentVariants> & {
      hideClose?: boolean
      dialogOverlayProps?: React.ComponentPropsWithoutRef<typeof DialogOverlay>
      centered?: boolean
    }
>(
  (
    { className, children, size, hideClose, dialogOverlayProps, centered = true, ...props },
    ref
  ) => (
    <DialogPortal>
      <DialogOverlay centered={centered} {...dialogOverlayProps}>
        <DialogPrimitive.Content
          ref={ref}
          className={cn(DialogContentVariants({ size }), className)}
          {...props}
        >
          {children}
          {!hideClose && (
            <DialogPrimitive.Close
              className={cn(
                'absolute p-0.5 right-3.5 top-3.5 rounded-sm opacity-20 ring-offset-background transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-foreground-muted',
                'before:content-[""] before:block before:absolute before:top-1/2 before:left-1/2 before:w-full before:h-full before:outline-red-500 before:outline-2 before:min-w-6 before:min-h-6 before:z-50 before:-translate-x-1/2 before:-translate-y-1/2'
              )}
            >
              <X size={16} />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogOverlay>
    </DialogPortal>
  )
)
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof DialogPaddingVariants>
>(({ className, padding, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    className={cn(
      'flex flex-col gap-1.5 text-center sm:text-left',
      DialogPaddingVariants({ padding }),
      className
    )}
  />
))

DialogHeader.displayName = 'DialogHeader'

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof DialogPaddingVariants>
>(({ className, children, padding, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      'border-t',
      DialogPaddingVariants({ padding }),
      className
    )}
    {...props}
  >
    {children}
  </div>
))
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    // [Danny] max-w to make space for the close button
    className={cn('text-base leading-none font-normal max-w-[calc(100%-1rem)]', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-foreground-lighter', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

const DialogClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Close
    ref={ref}
    className={cn(
      'opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-foreground-muted',
      className
    )}
    {...props}
  >
    {children}
  </DialogPrimitive.Close>
))
DialogClose.displayName = DialogPrimitive.Close.displayName

const DialogSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof DialogPaddingVariants>
>(({ className, children, padding, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    className={cn(DialogPaddingVariants({ padding }), 'overflow-hidden', className)}
  >
    {children}
  </div>
))
DialogSection.displayName = 'DialogSection'

const DialogSectionSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} {...props} className={cn('w-full h-px bg-border', className)} />
))
DialogSectionSeparator.displayName = 'DialogSectionSeparator'

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  type DialogProps,
}
