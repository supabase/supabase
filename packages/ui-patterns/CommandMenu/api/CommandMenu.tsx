import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { type PropsWithChildren, forwardRef, useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { Button, Command_Shadcn_, Dialog, DialogContent, cn } from 'ui'

import { useCurrentPage, usePageComponent, usePopPage } from './hooks/pagesHooks'
import { useQuery, useSetQuery } from './hooks/queryHooks'
import {
  useCommandMenuSize,
  useCommandMenuVisible,
  useSetCommandMenuVisible,
} from './hooks/viewHooks'
import { PageType } from './utils'

const Breadcrumb = () => {
  const currPage = useCurrentPage()
  const popPage = usePopPage()

  if (!currPage) return

  return (
    <div className="flex items-center gap-2 mt-2 ml-2 text-xs text-foreground-muted">
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
        'flex h-full w-full flex-col overflow-hidden',
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

const CommandError = ({ resetErrorBoundary }: { resetErrorBoundary: () => void }) => {
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

const PageSwitch = ({ children }: PropsWithChildren) => {
  const PageComponent = usePageComponent()

  return PageComponent ? <PageComponent /> : <CommandWrapper>{children}</CommandWrapper>
}

const useAnimateOnChange = (value: unknown, duration: number) => {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    setAnimate(true)
    setTimeout(() => setAnimate(false), duration)
  }, [value])

  return animate
}

const CommandMenu = ({ children }: PropsWithChildren) => {
  const open = useCommandMenuVisible()
  const setOpen = useSetCommandMenuVisible()

  const size = useCommandMenuSize()

  const page = useCurrentPage()
  const popPage = usePopPage()
  const animateBounce = useAnimateOnChange(page, 126)

  const query = useQuery()
  const setQuery = useSetQuery()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        hideClose
        onInteractOutside={() => setOpen(false)}
        onEscapeKeyDown={(e) => {
          e.preventDefault()
          return query ? setQuery('') : page ? popPage() : setOpen(false)
        }}
        size={size}
        className={cn(
          '!bg-overlay/90 backdrop-filter backdrop-blur-sm',
          '!border-overlay/90',
          'transition ease-out',
          'place-self-start mx-auto top-24',
          animateBounce ? 'scale-[101.5%]' : 'scale-100'
        )}
      >
        <ErrorBoundary FallbackComponent={CommandError}>
          <PageSwitch>{children}</PageSwitch>
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  )
}

export { CommandMenu, CommandWrapper }
