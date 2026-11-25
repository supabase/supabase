'use client'

import { useFramework } from 'common'
import { ComponentProps, useEffect, useRef, type MouseEvent } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useWindowSize } from 'react-use'
import { cn, CommandEmpty, Sheet, SheetContent } from 'ui'

const MobileSheetNav: React.FC<{
  children: React.ReactNode
  open?: boolean
  onOpenChange(open: boolean): void
  className?: string
  shouldCloseOnRouteChange?: boolean
  shouldCloseOnQueryChange?: boolean
  shouldCloseOnViewportResize?: boolean
  onPointerDownOutside?: ComponentProps<typeof SheetContent>['onPointerDownOutside']
}> = ({
  children,
  open = false,
  onOpenChange,
  className,
  shouldCloseOnRouteChange = true,
  shouldCloseOnQueryChange = true,
  shouldCloseOnViewportResize = true,
  onPointerDownOutside,
}) => {
  const { asPath } = useFramework()
  const { width } = useWindowSize()

  const fullPath = asPath ?? ''
  const previousPath = useRef(fullPath)
  useEffect(() => {
    const hasPathnameChanged = previousPath.current.split(/[?#]/)[0] !== fullPath.split(/[?#]/)[0]
    previousPath.current = fullPath
    if (shouldCloseOnRouteChange && (shouldCloseOnQueryChange || hasPathnameChanged)) {
      onOpenChange(false)
    }
  }, [fullPath])

  // Close as soon as a link in the sheet is tapped instead of waiting for `asPath`, which hosts like
  // Studio only update once the destination route has loaded.
  const closeOnLinkClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!shouldCloseOnRouteChange) return
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null
    if (!(anchor instanceof HTMLAnchorElement)) return
    if ((anchor.target && anchor.target !== '_self') || anchor.origin !== window.location.origin)
      return
    // Same-page targets are left to the `asPath` check above.
    if (anchor.pathname === window.location.pathname) {
      if (!shouldCloseOnQueryChange || anchor.search === window.location.search) return
    }
    onOpenChange(false)
  }

  useEffect(() => {
    if (shouldCloseOnViewportResize) {
      onOpenChange(false)
    }
  }, [width])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id="mobile-sheet-content"
        aria-describedby={undefined}
        showClose={false}
        size="full"
        side="bottom"
        onPointerDownOutside={onPointerDownOutside}
        onClick={closeOnLinkClick}
        className={cn(
          'rounded-t-lg bg-background overflow-hidden overflow-y-scroll h-[85dvh] md:max-h-[500px]',
          className
        )}
      >
        <ErrorBoundary FallbackComponent={() => <CommandEmpty />}>{children}</ErrorBoundary>
      </SheetContent>
    </Sheet>
  )
}

export { MobileSheetNav }
export default MobileSheetNav
