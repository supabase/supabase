import type { PropsWithChildren } from 'react'
import { Dialog, DialogContent, DialogTitle } from 'ui'

export const RecoveryTakeover = ({
  children,
  restoreFocusTo,
}: PropsWithChildren<{ restoreFocusTo: HTMLElement | null }>) => {
  return (
    <Dialog open>
      <DialogContent
        hideClose
        aria-label="Account recovery"
        aria-describedby={undefined}
        className="w-full max-w-none sm:max-w-none md:max-w-none border-0 rounded-none sm:rounded-none shadow-none outline-none data-[state=open]:animate-none data-[state=closed]:animate-none"
        dialogOverlayProps={{ className: 'block p-0 bg-studio backdrop-blur-none' }}
        onKeyDown={(event) => event.stopPropagation()}
        onKeyUp={(event) => event.stopPropagation()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          event.currentTarget instanceof HTMLElement && event.currentTarget.focus()
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          if (restoreFocusTo?.isConnected) restoreFocusTo.focus()
        }}
      >
        <DialogTitle className="sr-only">Account recovery</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  )
}
