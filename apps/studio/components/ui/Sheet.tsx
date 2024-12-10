import { usePathname } from 'next/navigation'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { cn, Dialog, DialogContent } from 'ui'

interface SheetContextType {
  openSheet: () => void
  closeSheet: () => void
  isOpen: boolean
  setMenu: (menu: React.ReactNode) => void
}

const SheetContext = createContext<SheetContextType | undefined>(undefined)

export const useSheet = () => {
  const context = useContext(SheetContext)
  if (!context) {
    throw new Error('useSheet must be used within a SheetProvider')
  }
  return context
}

export const SheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [menu, setMenu] = useState<React.ReactNode>(null)

  const openSheet = () => setIsOpen(true)
  const closeSheet = () => setIsOpen(false)

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <SheetContext.Provider value={{ openSheet, closeSheet, isOpen, setMenu }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          id="command-menu-dialog-content"
          hideClose
          forceMount
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={() => setIsOpen(false)}
          size={'small'}
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
          <ErrorBoundary FallbackComponent={() => <div>Error</div>}>{menu}</ErrorBoundary>
        </DialogContent>
      </Dialog>
    </SheetContext.Provider>
  )
}
