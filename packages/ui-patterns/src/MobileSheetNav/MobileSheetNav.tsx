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
  className?: string
}> = ({ children, open = false, onOpenChange, className }) => {
  const router = useRouter()
  const { width } = useWindowSize()

  const pathWithoutQuery = router?.asPath?.split('?')?.[0]
  useEffect(() => {
    onOpenChange(false)
  }, [pathWithoutQuery])

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
          'rounded-t-lg bg-background overflow-hidden overflow-y-scroll h-[85dvh] md:max-h-[500px]',
          className
        )}
      >
        <ErrorBoundary FallbackComponent={() => <CommandEmpty_Shadcn_ />}>{children}</ErrorBoundary>
      </SheetContent>
    </Sheet>
  )
}

export { MobileSheetNav }
export default MobileSheetNav
