'use client'

import { useRouter } from 'next/router'
import { ComponentProps, useEffect } from 'react'
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
  const router = useRouter()
  const { width } = useWindowSize()

  const fullPath = router?.asPath ?? ''
  const navigationPath = shouldCloseOnQueryChange ? fullPath : fullPath.split(/[?#]/)[0]
  useEffect(() => {
    if (shouldCloseOnRouteChange) {
      onOpenChange(false)
    }
  }, [navigationPath])

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
