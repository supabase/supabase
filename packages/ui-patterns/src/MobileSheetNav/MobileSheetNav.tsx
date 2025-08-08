'use client'

import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useWindowSize } from 'react-use'
import { CommandEmpty_Shadcn_, Sheet, SheetContent } from 'ui'
import { cn } from 'ui/src/lib/utils'

const MobileSheetNav: React.FC<{
  children: React.ReactNode
  open?: boolean
  onOpenChange(open: boolean): void
  stickyBottom?: boolean
}> = ({ children, open = false, onOpenChange, stickyBottom = false }) => {
  const router = useRouter()
  const { width } = useWindowSize()

  useEffect(() => {
    onOpenChange(false)
  }, [router?.asPath])

  useEffect(() => {
    onOpenChange(false)
  }, [width])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id="mobile-sheet-content"
        showClose={false}
        size="full"
        side="bottom"
        className={cn(
          'rounded-t-lg overflow-hidden overflow-y-scroll h-[85dvh] md:max-h-[500px]',
          stickyBottom ? 'pt-2 pb-0' : 'py-2'
        )}
      >
        <ErrorBoundary FallbackComponent={() => <CommandEmpty_Shadcn_ />}>{children}</ErrorBoundary>
      </SheetContent>
    </Sheet>
  )
}

export default MobileSheetNav
