import { useBreakpoint } from 'common'
import React, { ReactNode } from 'react'
import { cn, Modal } from 'ui'

interface PopupFrameProps {
  triggerContainerClassName?: string
  trigger?: ReactNode
  onOpenCallback?: any
  className?: string
  children: ReactNode
}

export function PopupFrame({
  triggerContainerClassName = '',
  trigger,
  onOpenCallback,
  className,
  children,
}: PopupFrameProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useBreakpoint(768)

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          return setOpen(false)
        default:
          return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  React.useEffect(() => {
    if (isMobile) setOpen(false)
  }, [isMobile])

  return (
    <>
      <Modal
        visible={open}
        hideFooter
        showCloseButton={false}
        className={cn(
          '!bg-[#f8f9fa]/95 dark:!bg-[#1c1c1c]/80',
          '!border-[#e6e8eb]/90 dark:!border-[#282828]/90',
          'transition ease-out',
          'mx-auto backdrop-blur-md w-[calc(100%-2rem)]',
          className
        )}
        onInteractOutside={(e) => {
          // Only hide menu when clicking outside, not focusing outside
          // Prevents Firefox dropdown issue that immediately closes menu after opening
          if (e.type === 'dismissableLayer.pointerDownOutside') {
            setOpen(!open)
          }
        }}
        size="xxlarge"
      >
        <div className="device-frame !w-full h-full flex items-center justify-center">
          <div className="modal-group relative w-full h-full">
            <button
              onClick={() => setOpen(false)}
              className="text-foreground-light hover:text-foreground absolute -top-8 right-0"
            >
              <p className="text-xs">Close</p>
            </button>
            <div className="modal-content h-full !rounded-lg !border-none !overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </Modal>
      <button
        onClick={() => {
          if (onOpenCallback) onOpenCallback()
          setOpen(true)
        }}
        className={cn('w-full', triggerContainerClassName)}
      >
        {trigger ?? 'Expand'}
      </button>
    </>
  )
}
