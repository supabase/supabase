'use client'

import { useRouter } from 'next/compat/router'
import React, { useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useWindowSize } from 'react-use'
import { cn, CommandEmpty_Shadcn_, Dialog, DialogContent, DialogHeader } from 'ui'
import SheetContext from './SheetContext'
import useDragToClose from 'common/hooks/useDragToClose'

const SheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [sheetContent, setSheetContent] = useState<React.ReactNode>(null)
  const { width } = useWindowSize()
  const {
    ref: contentRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDragToClose({
    onClose: () => setIsOpen(false),
  })

  const openSheet = () => setIsOpen(true)
  const closeSheet = () => setIsOpen(false)

  useEffect(() => {
    setIsOpen(false)
  }, [router?.pathname])

  useEffect(() => {
    setIsOpen(false)
  }, [width])

  return (
    <SheetContext.Provider value={{ openSheet, closeSheet, isOpen, setSheetContent }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          ref={contentRef}
          id="command-menu-dialog-content"
          hideClose
          forceMount
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={() => setIsOpen(false)}
          size="large"
          className={cn(
            'relative flex flex-col my-0 mx-auto rounded-t-lg overflow-hidden overflow-y-scroll',
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
          <ErrorBoundary FallbackComponent={() => <CommandEmpty_Shadcn_ />}>
            {sheetContent}
          </ErrorBoundary>
        </DialogContent>
      </Dialog>
    </SheetContext.Provider>
  )
}

export default SheetProvider
