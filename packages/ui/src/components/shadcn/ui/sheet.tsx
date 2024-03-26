'use client'

import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { X } from 'lucide-react'
import { cn } from '../../../lib/utils/cn'

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const portalVariants = cva('fixed inset-0 z-40 flex', {
  variants: {
    side: {
      top: 'items-start',
      bottom: 'items-end',
      left: 'justify-start',
      right: 'justify-end',
    },
  },
  defaultVariants: { side: 'right' },
})

interface SheetPortalProps
  extends SheetPrimitive.DialogPortalProps,
    VariantProps<typeof portalVariants> {}

const SheetPortal = ({ side, children, ...props }: SheetPortalProps) => (
  <SheetPrimitive.Portal {...props}>
    <div className={portalVariants({ side })}>{children}</div>
  </SheetPrimitive.Portal>
)
SheetPortal.displayName = SheetPrimitive.Portal.displayName

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, children, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-40 bg-alternative/90 backdrop-blur-sm transition-all duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in',
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva('fixed z-40 scale-100 gap-4 bg-studio opacity-100 shadow-lg', {
  variants: {
    side: {
      top: 'animate-in slide-in-from-top w-full duration-300 border-b',
      bottom: 'animate-in slide-in-from-bottom w-full duration-300 border-t',
      left: 'animate-in slide-in-from-left h-full duration-300 border-r',
      right: 'animate-in slide-in-from-right h-full duration-300 border-l',
    },
    size: {
      content: '',
      default: '',
      sm: '',
      lg: '',
      xl: '',
      xxl: '',
      full: '',
    },
  },
  compoundVariants: [
    {
      side: ['top', 'bottom'],
      size: 'content',
      class: 'max-h-screen',
    },
    {
      side: ['top', 'bottom'],
      size: 'default',
      class: 'h-1/3',
    },
    {
      side: ['top', 'bottom'],
      size: 'sm',
      class: 'h-1/4',
    },
    {
      side: ['top', 'bottom'],
      size: 'lg',
      class: 'h-1/2',
    },
    {
      side: ['top', 'bottom'],
      size: 'xl',
      class: 'h-5/6',
    },
    {
      side: ['top', 'bottom'],
      size: 'full',
      class: 'h-screen',
    },
    {
      side: ['right', 'left'],
      size: 'content',
      class: 'max-w-screen',
    },
    {
      side: ['right', 'left'],
      size: 'default',
      class: 'w-1/3',
    },
    {
      side: ['right', 'left'],
      size: 'sm',
      class: 'w-1/4',
    },
    {
      side: ['right', 'left'],
      size: 'lg',
      class: 'w-1/2',
    },
    {
      side: ['right', 'left'],
      size: 'xl',
      class: 'w-4/6',
    },
    {
      side: ['right', 'left'],
      size: 'xxl',
      class: 'w-5/6',
    },
    {
      side: ['right', 'left'],
      size: 'full',
      class: 'w-screen',
    },
  ],
  defaultVariants: {
    side: 'right',
    size: 'default',
  },
})

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  showClose?: boolean
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  DialogContentProps
>(({ side, size, className, children, showClose = true, ...props }, ref) => (
  <SheetPortal side={side}>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side, size }), className)}
      {...props}
    >
      {children}
      {showClose ? (
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      ) : null}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5 py-4 text-center sm:text-left border-b', className)} {...props} />
)
SheetHeader.displayName = 'SheetHeader'

const SheetSection = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-content py-content', className)} {...props} />
)
SheetSection.displayName = 'SheetSection'

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'px-5 py-3 border-t w-full',
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('text-base text-foreground', className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-sm text-foreground-muted', className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
}
