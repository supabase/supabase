'use client'

import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useBreakpoint } from 'common'
import useDragToClose from 'common/hooks/useDragToClose'
import { AlertTriangle, ArrowLeft, Command, Search } from 'lucide-react'
import type { HTMLAttributes, MouseEvent, PropsWithChildren, ReactElement, ReactNode } from 'react'
import { Children, cloneElement, forwardRef, isValidElement, useEffect, useMemo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import {
  Button,
  cn,
  Command_Shadcn_,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from 'ui'

import { useCurrentPage, usePageComponent, usePopPage } from './hooks/pagesHooks'
import { useQuery, useSetQuery } from './hooks/queryHooks'
import { useCommandMenuTelemetryContext } from './hooks/useCommandMenuTelemetryContext'
import {
  useCommandMenuOpen,
  useCommandMenuSize,
  useSetCommandMenuOpen,
  useSetupCommandMenuTouchEvents,
} from './hooks/viewHooks'

function Breadcrumb({ className }: { className?: string }) {
  const currPage = useCurrentPage()
  const popPage = usePopPage()

  if (!currPage) return

  return (
    <button
      type="button"
      className={cn(
        'p-2 bg-overlay flex items-center gap-2 text-xs text-foreground-muted',
        className
      )}
      onClick={popPage}
    >
      <ArrowLeft width={12} height={12} />
      {currPage.name}
    </button>
  )
}

const CommandWrapper = forwardRef<
  React.ElementRef<typeof Command_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof Command_Shadcn_>
>(({ children, className, ...props }, ref) => {
  return (
    <Command_Shadcn_
      ref={ref}
      className={cn(
        'h-full w-full flex flex-col overflow-hidden',
        '[&_[cmdk-group]]:px-2 [&_[cmdk-group]]:!bg-transparent [&_[cmdk-group-heading]]:!bg-transparent [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-border-stronger [&_[cmdk-input]]:h-12',
        '[&_[cmdk-item]_svg]:h-5',
        '[&_[cmdk-item]_svg]:w-5',
        '[&_[cmdk-item]_svg]:stroke-1',
        '[&_[cmdk-input-wrapper]_svg]:h-5',
        '[&_[cmdk-input-wrapper]_svg]:w-5',

        '[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0',
        className
      )}
      {...props}
    >
      {children}
    </Command_Shadcn_>
  )
})
CommandWrapper.displayName = Command_Shadcn_.displayName

function CommandError({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <div className={cn('min-h-64', 'flex items-center justify-center')}>
      <div className="p-10 flex flex-col items-center gap-6 mt-4">
        <AlertTriangle strokeWidth={1.5} size={40} />
        <p className="text-lg text-center">
          Sorry, looks like we&apos;re having some issues with the command menu!
        </p>
        <p className="text-sm text-center">Please try again in a bit.</p>
        <Button size="tiny" type="secondary" onClick={resetErrorBoundary}>
          Try again?
        </Button>
      </div>
    </div>
  )
}

function PageSwitch({ children }: PropsWithChildren) {
  const PageComponent = usePageComponent()

  return PageComponent ? <PageComponent /> : <CommandWrapper>{children}</CommandWrapper>
}

function useTouchGestures({ toggleOpen }: { toggleOpen: () => void }) {
  const { ref, handleTouchStart, handleTouchMove, handleTouchEnd } = useDragToClose({
    onClose: toggleOpen,
  })

  const setupTouchHandlers = useSetupCommandMenuTouchEvents()
  const touchHandlers = useMemo(
    () => ({ handleTouchStart, handleTouchMove, handleTouchEnd }),
    [handleTouchStart, handleTouchMove, handleTouchEnd]
  )
  useEffect(() => {
    setupTouchHandlers(touchHandlers)
  }, [touchHandlers])

  return { ref }
}

function CommandMenuTrigger({ children }: PropsWithChildren) {
  const open = useCommandMenuOpen()
  const setOpen = useSetCommandMenuOpen()
  const telemetryContext = useCommandMenuTelemetryContext()

  const childFromProps = Children.only(children) as ReactElement<
    {
      onClick?: (event: MouseEvent) => void
      onOpen?: (open: boolean) => void
    } & HTMLAttributes<HTMLElement>
  >
  if (!childFromProps || !isValidElement(childFromProps)) return null

  const handleOpen = () => {
    setOpen(!open)
    childFromProps.props.onOpen?.(!open)

    // Send telemetry when opening via click
    if (!open && telemetryContext?.onTelemetry) {
      const event = {
        action: 'command_menu_opened' as const,
        properties: {
          trigger_type: 'search_input' as const,
          app: telemetryContext.app,
        },
        groups: {},
      }

      telemetryContext.onTelemetry(event)
    }
  }

  const childWithClickHandler = cloneElement(childFromProps, {
    onClick: handleOpen,
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    'aria-controls': 'command-menu-dialog-content',
    className: cn(
      'h-10 px-4 py-2',
      'inline-flex items-center justify-center',
      'whitespace-nowrap',
      'rounded-md border border-input bg-background',
      'text-sm',
      'hover:bg-accent hover:text-accent-foreground',
      'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'transition-colors',
      childFromProps.props.className
    ),
  })
  return childWithClickHandler
}

function CommandMenuTriggerInput({
  className,
  placeholder = 'Search...',
  showShortcut = true,
}: {
  className?: string
  placeholder?: string | React.ReactNode
  showShortcut?: boolean
}) {
  return (
    <CommandMenuTrigger>
      <button
        type="button"
        className={cn(
          'group',
          'flex-grow md:min-w-44 xl:min-w-56 h-[30px] rounded-md',
          'pl-1.5 md:pl-2 pr-1',
          'flex items-center justify-between',
          'bg-surface-100/75 text-foreground-lighter border',
          'hover:bg-opacity-100 hover:border-stronger',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-border-strong focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          'transition',
          className
        )}
      >
        <div className="flex items-center space-x-1.5 text-foreground-lighter">
          <Search
            size={16}
            strokeWidth={1.5}
            className="group-hover:text-foreground-light transition-colors"
          />
          <p className="flex text-xs pr-2 text-foreground-muted">{placeholder}</p>
        </div>
        {showShortcut && (
          <div className="command-shortcut hidden md:flex items-center space-x-1">
            <div
              aria-hidden="true"
              className="md:flex items-center justify-center h-full px-1 border rounded bg-surface-300 gap-0.5"
            >
              <Command size={12} strokeWidth={1.5} />
              <span className="text-[12px]">K</span>
            </div>
          </div>
        )}
      </button>
    </CommandMenuTrigger>
  )
}

interface CommandMenuProps extends PropsWithChildren {
  trigger?: ReactNode
}

function CommandMenu({ children, trigger }: CommandMenuProps) {
  const open = useCommandMenuOpen()
  const setOpen = useSetCommandMenuOpen()

  const isMobile = useBreakpoint('sm')

  const size = useCommandMenuSize()

  const page = useCurrentPage()
  const popPage = usePopPage()

  const query = useQuery()
  const setQuery = useSetQuery()

  const { ref: contentRef } = useTouchGestures({ toggleOpen: () => setOpen(!open) })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent
        id="command-menu-dialog-content"
        hideClose
        forceMount
        ref={contentRef}
        onOpenAutoFocus={(e) => isMobile && e.preventDefault()}
        onInteractOutside={() => setOpen(false)}
        onEscapeKeyDown={(e) => {
          e.preventDefault()
          return query ? setQuery('') : page ? popPage() : setOpen(false)
        }}
        size={size}
        className={cn(
          'relative flex flex-col my-0 mx-auto rounded-t-lg overflow-hidden',
          'h-[85dvh] mt-[15vh] md:max-h-[500px] md:mt-0 left-0 bottom-0 md:bottom-auto',
          '!animate-in !slide-in-from-bottom-[85%] !duration-300',
          'data-[state=closed]:!animate-out data-[state=closed]:!slide-out-to-bottom',
          // Remove defaults set from primitive component
          '!slide-in-from-left-[0%] :!slide-in-from-top-[0%]',
          // Remove defaults set from primitive component
          '!slide-out-to-left-[0%] !slide-out-to-top-[0%]',
          'md:data-[state=open]:!slide-in-from-bottom-[0%] md:data-[state=closed]:!slide-out-to-bottom-[0%]',
          'md:data-[state=open]:!zoom-in-95 md:data-[state=closed]:!zoom-out-95'
        )}
        dialogOverlayProps={{
          className: cn('overflow-hidden flex data-closed:delay-100'),
        }}
      >
        <VisuallyHidden>
          <DialogTitle>Command menu</DialogTitle>
          <DialogDescription>Type a command or search</DialogDescription>
        </VisuallyHidden>
        <ErrorBoundary FallbackComponent={CommandError}>
          <PageSwitch>{children}</PageSwitch>
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  )
}

export { Breadcrumb, CommandMenu, CommandMenuTrigger, CommandMenuTriggerInput, CommandWrapper }
