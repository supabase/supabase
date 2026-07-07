'use client'

import { cva, VariantProps } from 'class-variance-authority'
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'
import { Button, ButtonVariantProps, buttonVariants } from './../../Button'

type AlertDialogContextValue = {
  loading: boolean
  setActionLoading: (id: symbol, loading: boolean) => void
  setOpen: (open: boolean, options?: { force?: boolean }) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null)

const useAlertDialogContext = () => React.useContext(AlertDialogContext)

type AlertDialogProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Root>

const AlertDialog = ({
  children,
  defaultOpen = false,
  onOpenChange,
  open: openProp,
  ...props
}: AlertDialogProps) => {
  const onOpenChangeRef = React.useRef(onOpenChange)
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const [loadingActionIds, setLoadingActionIds] = React.useState<Set<symbol>>(() => new Set())
  const loading = loadingActionIds.size > 0
  const open = openProp ?? uncontrolledOpen

  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  }, [onOpenChange])

  const setActionLoading = React.useCallback((id: symbol, actionLoading: boolean) => {
    setLoadingActionIds((currentIds) => {
      const nextIds = new Set(currentIds)

      if (actionLoading) nextIds.add(id)
      else nextIds.delete(id)

      return nextIds
    })
  }, [])

  const setOpen = React.useCallback(
    (nextOpen: boolean, options?: { force?: boolean }) => {
      if (loading && !nextOpen && !options?.force) return

      if (openProp === undefined) {
        setUncontrolledOpen(nextOpen)
      }

      onOpenChangeRef.current?.(nextOpen)
    },
    [loading, openProp]
  )

  const contextValue = React.useMemo(
    () => ({ loading, setActionLoading, setOpen }),
    [loading, setActionLoading, setOpen]
  )

  return (
    <AlertDialogContext.Provider value={contextValue}>
      <AlertDialogPrimitive.Root open={open} onOpenChange={setOpen} {...props}>
        {children}
      </AlertDialogPrimitive.Root>
    </AlertDialogContext.Provider>
  )
}
AlertDialog.displayName = AlertDialogPrimitive.Root.displayName

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
      'bg-black/40 backdrop-blur-xs',
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
    'relative z-50 w-full max-w-screen border shadow-md dark:shadow-xs',
    'data-open:animate-overlay-show data-closed:animate-overlay-hide',
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
>(
  (
    {
      className,
      children,
      size,
      dialogOverlayProps,
      centered = true,
      onEscapeKeyDown,
      onFocusOutside,
      ...props
    },
    ref
  ) => {
    const alertDialogContext = useAlertDialogContext()

    return (
      <AlertDialogPortal>
        <AlertDialogOverlay centered={centered} {...dialogOverlayProps}>
          <AlertDialogPrimitive.Content
            ref={ref}
            className={cn(AlertDialogContentVariants({ size }), className)}
            onEscapeKeyDown={(event) => {
              onEscapeKeyDown?.(event)
              if (alertDialogContext?.loading) event.preventDefault()
            }}
            onFocusOutside={(event) => {
              onFocusOutside?.(event)
              if (alertDialogContext?.loading) event.preventDefault()
            }}
            {...props}
          >
            {children}
          </AlertDialogPrimitive.Content>
        </AlertDialogOverlay>
      </AlertDialogPortal>
    )
  }
)
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col text-left', className)} {...props} />
)
AlertDialogHeader.displayName = 'AlertDialogHeader'

const AlertDialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="alert-dialog-body"
    className={cn(
      '[&>[role=alert]]:mb-0 [&>[role=alert]]:rounded-none [&>[role=alert]]:border-x-0',
      className
    )}
    {...props}
  />
)
AlertDialogBody.displayName = 'AlertDialogBody'

// Full-width alerts own the visual separator above the footer.
const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="alert-dialog-footer"
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 border-t py-3 px-5 [[data-slot=alert-dialog-body]:has(>[role=alert])+&]:border-t-0',
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

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  )
}

type AlertDialogActionProps = Omit<
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>,
  'onClick'
> & {
  variant?: NonNullable<ButtonVariantProps['variant']>
  loading?: boolean
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => unknown
}

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  AlertDialogActionProps
>(
  (
    {
      asChild,
      children,
      className,
      disabled,
      loading: loadingProp = false,
      onClick,
      variant = 'primary',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const alertDialogContext = useAlertDialogContext()
    const dialogLoading = alertDialogContext?.loading ?? false
    const setActionLoading = alertDialogContext?.setActionLoading
    const setOpen = alertDialogContext?.setOpen
    const actionId = React.useRef(Symbol('AlertDialogAction'))
    const [internalLoading, setInternalLoading] = React.useState(false)
    const loading = loadingProp || internalLoading
    const isDisabled = disabled || loading || dialogLoading

    React.useEffect(() => {
      setActionLoading?.(actionId.current, loading)

      return () => {
        setActionLoading?.(actionId.current, false)
      }
    }, [loading, setActionLoading])

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        event.preventDefault()
        return
      }

      const result = onClick?.(event)

      if (!isPromiseLike(result)) return

      event.preventDefault()
      setInternalLoading(true)

      void (async () => {
        try {
          await result
          setOpen?.(false, { force: true })
        } catch {
          // Keep the dialog open so consumers can surface mutation errors in context.
        } finally {
          setInternalLoading(false)
        }
      })()
    }

    if (asChild) {
      return (
        <AlertDialogPrimitive.Action
          ref={ref}
          asChild
          className={cn(buttonVariants({ variant: variant, size: 'tiny' }), className)}
          disabled={isDisabled}
          onClick={handleClick}
          type={type}
          {...props}
        >
          {children}
        </AlertDialogPrimitive.Action>
      )
    }

    return (
      <AlertDialogPrimitive.Action asChild onClick={handleClick} {...props}>
        <Button
          ref={ref}
          className={className}
          disabled={isDisabled}
          type={type}
          loading={loading}
          variant={variant}
        >
          {children}
        </Button>
      </AlertDialogPrimitive.Action>
    )
  }
)
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, disabled, ...props }, ref) => {
  const alertDialogContext = useAlertDialogContext()

  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      className={cn(
        buttonVariants({ variant: 'default', size: 'tiny' }),
        'mt-2 sm:mt-0',
        className
      )}
      disabled={disabled || alertDialogContext?.loading}
      {...props}
    />
  )
})
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
}
