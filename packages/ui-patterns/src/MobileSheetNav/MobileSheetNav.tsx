'use client'

import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useWindowSize } from 'react-use'
import { CommandEmpty, Sheet, SheetContent } from 'ui'
import { cn } from 'ui/src/lib/utils'

const MobileSheetNav: React.FC<{
  children: React.ReactNode
  open?: boolean
  onOpenChange(open: boolean): void
  className?: string
  shouldCloseOnRouteChange?: boolean
  shouldCloseOnViewportResize?: boolean
}> = ({
  children,
  open = false,
  onOpenChange,
  className,
  shouldCloseOnRouteChange = true,
  shouldCloseOnViewportResize = true,
}) => {
  const router = useRouter()
  const { width } = useWindowSize()

  // Use full asPath (including query) so the sheet closes when navigating to the same path with
  // different query params (e.g. Integrations submenu: All vs Wrappers vs Postgres Modules).
  const fullPath = router?.asPath ?? ''
  useEffect(() => {
    if (shouldCloseOnRouteChange) {
      onOpenChange(false)
    }
  }, [fullPath])

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
        onPointerDownOutside={(event) => {
          // Buttons in the floating toolbar (#mobile-nav-actions) render outside this sheet, so
          // Radix treats taps on them as an outside click and closes the sheet before the button's
          // own onClick runs. Those buttons already manage the sheet themselves, so don't let
          // Radix's outside-dismiss pre-empt them.
          if ((event.target as HTMLElement | null)?.closest('#mobile-nav-actions')) {
            event.preventDefault()
          }
        }}
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
