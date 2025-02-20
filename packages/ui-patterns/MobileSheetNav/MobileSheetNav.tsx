'use client'

import { X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useWindowSize } from 'react-use'
import { CommandEmpty_Shadcn_, Sheet, SheetContent, SheetHeader, SheetTrigger } from 'ui'
import { cn } from 'ui/src/lib/utils'

const MobileSheetNav: React.FC<{
  children: React.ReactNode
  open?: boolean
  onOpenChange(open: boolean): void
}> = ({ children, open = false, onOpenChange }) => {
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
          'rounded-t-lg border overflow-hidden overflow-y-scroll',
          'h-[85dvh] md:max-h-[500px]'
        )}
      >
        <ErrorBoundary FallbackComponent={() => <CommandEmpty_Shadcn_ />}>
          {/* Sticky header for the close button */}
          <SheetHeader className="sticky flex justify-end z-10 -top-0.5 mb-2 bg-inherit rounded-t-lg">
            <SheetTrigger>
              <X size={18} />
            </SheetTrigger>
          </SheetHeader>
          {/* Sheet content */}
          {children}
        </ErrorBoundary>
      </SheetContent>
    </Sheet>
  )
}

export default MobileSheetNav
