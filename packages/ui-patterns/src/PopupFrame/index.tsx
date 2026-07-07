import { useBreakpoint } from 'common'
import React, { ReactNode } from 'react'
import { cn, Dialog, DialogContent, DialogTrigger } from 'ui'

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
    if (isMobile) setOpen(false)
  }, [isMobile])

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>
        <button
          onClick={() => {
            if (onOpenCallback) onOpenCallback()
            setOpen(true)
          }}
          className={cn('w-full', triggerContainerClassName)}
        >
          {trigger ?? 'Expand'}
        </button>
      </DialogTrigger>
      <DialogContent className={className} size="xxlarge">
        <div className="device-frame w-full! h-full flex items-center justify-center">
          <div className="modal-group relative w-full h-full">
            <button
              onClick={() => setOpen(false)}
              className="text-foreground-light hover:text-foreground absolute -top-8 right-0"
            >
              <p className="text-xs">Close</p>
            </button>
            <div className="modal-content h-full rounded-lg! border-none! overflow-hidden!">
              {children}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
