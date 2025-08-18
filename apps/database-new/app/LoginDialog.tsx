'use client'

import { useAppStateSnapshot } from '@/lib/state'
import { DialogContent, Dialog } from 'ui'

const LoginDialog = ({ children }: { children: React.ReactNode }) => {
  const snap = useAppStateSnapshot()

  return (
    <Dialog
      open={snap.loginDialogOpen}
      onOpenChange={() => snap.setLoginDialogOpen(!snap.loginDialogOpen)}
    >
      <DialogContent className="max-w-md">{children}</DialogContent>
    </Dialog>
  )
}

export { LoginDialog }
