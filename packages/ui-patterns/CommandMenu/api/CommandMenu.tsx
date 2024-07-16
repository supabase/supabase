'use client'

import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { type PropsWithChildren, type ReactNode, forwardRef, memo, useEffect, useMemo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { useBreakpoint } from 'common'
import useDragToClose from 'common/hooks/useDragToClose'
import { Button, Command_Shadcn_, Dialog, DialogContent, DialogTrigger, cn } from 'ui'

import { useCurrentPage, usePageComponent, usePopPage } from './hooks/pagesHooks'
import { useQuery, useSetQuery } from './hooks/queryHooks'
import {
  useCommandMenuSize,
  useCommandMenuOpen,
  useSetCommandMenuOpen,
  useSetupCommandMenuTouchEvents,
} from './hooks/viewHooks'
import { PageType } from './utils'

function Breadcrumb({ className }: { className?: string }) {
  const currPage = useCurrentPage()
  const popPage = usePopPage()

  if (!currPage) return

  return (
    <div
      className={cn('flex items-center gap-2 mt-2 ml-2 text-xs text-foreground-muted', className)}
    >
      <button onClick={popPage}>
        <ArrowLeft width={12} height={12} />
      </button>
      {currPage.name}
    </div>
  )
}

const CommandWrapper = forwardRef<
  React.ElementRef<typeof Command_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof Command_Shadcn_>
>(({ children, className, ...props }, ref) => {
  const currPage = useCurrentPage()

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
      {currPage?.type === PageType.Commands && <Breadcrumb />}
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

const CommandMenuTrigger = memo(DialogTrigger)

interface CommandMenuProps extends PropsWithChildren {
  trigger?: ReactNode
}

function CommandMenu({ children, trigger }: CommandMenuProps) {
  const open = useCommandMenuOpen()
  const setOpen = useSetCommandMenuOpen()

  const isMobile = useBreakpoint()

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
          'relative my-0 mx-auto rounded-t-lg overflow-y-scroll',
          'h-[85dvh] mt-[15vh] md:max-h-[500px] md:mt-0 left-0 bottom-0 md:bottom-auto',
          'place-self-end md:place-self-auto',
          open && '!animate-in !slide-in-from-bottom !duration-300',
          'data-[state=closed]:!animate-out data-[state=closed]:!slide-out-to-bottom',
          'md:data-[state=open]:!animate-in md:data-[state=closed]:!animate-out',
          'md:data-[state=closed]:!zoom-out-95 md:data-[state=open]:!zoom-in-95',
          'md:data-[state=closed]:!slide-out-to-left-[0%] md:data-[state=closed]:!slide-out-to-top-[0%]',
          'md:data-[state=open]:!slide-in-from-left-[0%] md:data-[state=open]:!slide-in-from-top-[0%]'
        )}
        dialogOverlayProps={{
          className: cn('overflow-hidden flex data-closed:delay-100'),
        }}
      >
        <ErrorBoundary FallbackComponent={CommandError}>
          <PageSwitch>{children}</PageSwitch>
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  )
}

export { Breadcrumb, CommandMenu, CommandMenuTrigger, CommandWrapper }
